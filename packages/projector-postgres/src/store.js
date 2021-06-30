const { EventEmitter } = require('events')
const { StreamPosition } = require('./constants')
const { log } = require('./logging')

const findOrRegisterCurrentCheckpoint = ({ client, name }) =>
  client
    .single(
      `
                insert into pg_journal_projection_state(checkpoint, name)
                values($1, $2)
                on conflict(name) do nothing
                returning checkpoint
      `,
      [StreamPosition.Start, name]
    )
    .then(({ checkpoint }) => BigInt(checkpoint))

const advanceCheckpoint = async ({ client, name, checkpoint }) =>
  client.query(
    `
      UPDATE pg_journal_projection_state
      SET checkpoint = $1
      WHERE name = $2`,
    [checkpoint, name]
  )

module.exports.PostgresProjector = ({ eventStore, client }) => ({
  start: ({ name, pollInterval, batchSize }) => {
    const emitter = new EventEmitter()

    findOrRegisterCurrentCheckpoint({
      client,
      name,
    })
      .then((currentCheckpoint) => {
        log.debug(
          `Projection with name: ${name} left off at checkpoint ${currentCheckpoint}. Resuming streaming replication`
        )

        const stream = eventStore.subscribeToAll({
          lastCheckpoint: currentCheckpoint,
          pollInterval,
          batchSize,
        })

        stream.on('error', (err) => emitter.emit('error', err))
        stream.on(
          'eventsAppeared',
          ({ events, checkpoint, ack: eventStoreAck }) => {
            console.log(`Received events at checkpoint`, checkpoint, events)
            return client.beginTransaction(
              () =>
                new Promise((resolve) =>
                  emitter.emit('eventsReadyForProcessing', {
                    events,
                    ack: () =>
                      advanceCheckpoint({ client, name, checkpoint })
                        .then(resolve)
                        .then(() => {
                          console.log(`Acking checkpoint`, checkpoint)
                        })
                        .then(eventStoreAck),
                  })
                )
            )
          }
        )
      })
      .catch((err) => {
        emitter.emit('error', err)
      })

    return emitter
  },
})
