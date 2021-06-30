const { storageTable } = require('./constants')
const { SystemProjection } = require('../constants')
const { EventEmitter } = require('events')
const { StreamPosition } = require('../constants')
const { log } = require('../logging')
const { assert } = require('chai')

module.exports = ({ client }) => ({
  startSystemProjection: ({ name, pollInterval, batchSize }) => {
    assert.include(Object.values(SystemProjection), name)

    const streamId = `projection-${name}`

    const emitter = new EventEmitter()
    require('../stream/read-stream-forwards')({
      client,
      isSystemStream: true,
    })
      .readStreamForwards({ streamId })
      .then(({ events }) => {
        const checkpoint =
          events.length > 0
            ? BigInt(events[events.length - 1].payload.checkpoint)
            : StreamPosition.Start

        log.debug(
          `System projection with name: ${name} left off at checkpoint ${checkpoint}. Resuming streaming replication`
        )

        const stream = require('../transientSubscription/subscribe-to-all')({
          client,
        }).subscribeToAll({
          lastCheckpoint: checkpoint,
          pollInterval,
          batchSize,
        })

        stream.on('error', (err) => emitter.emit(err))
        stream.on('eventsAppeared', ({ events, checkpoint, ack }) => {
          log.info('Received checkpoint', checkpoint)
          emitter.emit('eventsReadyForProcessing', {
            events,
            ack: () => {
              log.info(`Acking checkpoint: ${checkpoint}`)
              require('../stream/append-to-stream')({
                client,
                isSystemStream: true,
              })
                .appendToStream({
                  streamId,
                  events: [
                    {
                      type: 'CheckpointAdvanced',
                      payload: { checkpoint: checkpoint.toString() },
                    },
                  ],
                })
                .then(ack)
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
