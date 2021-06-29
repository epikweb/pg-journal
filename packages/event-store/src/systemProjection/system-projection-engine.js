const { SystemProjection } = require('../constants')
const { EventEmitter } = require('events')
const { StreamPosition } = require('../constants')
const { log } = require('../logging')
const { assert } = require('chai')

const findCurrentCheckpoint = ({ client, name }) =>
  client
    .single(
      `
                insert into pg_journal_system_projections(name, checkpoint)
                values($1, $2)
                on conflict(name) do nothing
                returning checkpoint
      `,
      [name, StreamPosition.Start]
    )
    .then((data) => BigInt(data.checkpoint))

module.exports = ({ client }) => ({
  startSystemProjection: ({ name, pollInterval, batchSize }) => {
    assert.include(Object.values(SystemProjection), name)

    const emitter = new EventEmitter()
    findCurrentCheckpoint({
      client,
      name,
    })
      .then((currentCheckpoint) => {
        log.debug(
          `Projection with name: ${name} left off at checkpoint ${currentCheckpoint}. Resuming streaming replication`
        )

        const stream = require('../transientSubscription/subscribe-to-all')({
          client,
        }).subscribeToAll({
          lastCheckpoint: currentCheckpoint,
          pollInterval,
          batchSize,
        })

        stream.on('error', (err) => emitter.emit(err))
        stream.on('eventsAppeared', ({ events, checkpoint, ack }) => {
          console.log('Received checkpoint', checkpoint)
          emitter.emit('eventsReadyForProcessing', {
            events,
            ack: () => {
              console.log(`Acking checkpoint: ${checkpoint}`)
              ack()
            },
          })
        })
      })
      .catch((err) => {
        emitter.emit('error', err)
      })

    return emitter
  },
})
