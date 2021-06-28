const { assert } = require('chai')
const { EventEmitter } = require('events')
const { log } = require('../logging')
const {
  retrieveEventsSinceLastCheckpoint,
} = require('./cmd/retrieve-events-since-last-checkpoint')
const { deliverEventsToConsumer } = require('./cmd/deliver-events-to-consumer')
const { CoreEvent } = require('./constants')
const { calculateFreeTime } = require('./core')
const { sleep } = require('../auxiliary')
const { poll } = require('./core')

module.exports = ({ client }) => ({
  streamFromAll: ({ batchSize = 500, pollInterval = 250, lastCheckpoint }) => {
    assert.typeOf(lastCheckpoint, 'number')

    const emitter = new EventEmitter()

    let running = true
    ;(async () => {
      let currentCheckpoint = lastCheckpoint

      while (running) {
        const start = Date.now()
        try {
          await retrieveEventsSinceLastCheckpoint({
            client,
            currentCheckpoint,
            batchSize,
          })
            .then((events) =>
              poll({ events, currentCheckpoint, now: new Date() })
            )
            .then(async (coreEvents) => {
              for (const event of coreEvents) {
                switch (event.type) {
                  case CoreEvent.ConsumerDeliveryRequested:
                    await deliverEventsToConsumer({
                      emitter,
                      events: event.payload.events,
                      nextCheckpoint: event.payload.nextCheckpoint,
                    })
                    break
                  case CoreEvent.CheckpointAdvanced:
                    currentCheckpoint = event.payload.nextCheckpoint
                    break
                  default:
                    throw new Error(`Invalid event type: ${event.type}`)
                }
              }
            })
        } catch (err) {
          log.error(`An error occurred during poll`, err)
          emitter.emit('error', err)
        }

        const freeTime = calculateFreeTime({
          start,
          pollInterval,
          now: Date.now(),
        })
        await sleep(freeTime)
      }
    })()

    return {
      on: emitter.on.bind(emitter),
      stop: () => {
        running = false
      },
    }
  },
})
