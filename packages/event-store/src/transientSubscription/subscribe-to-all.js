const { unmarshalEvent } = require('../event/event-core')
const { assert } = require('chai')
const { EventEmitter } = require('events')
const { log } = require('../logging')
const { CoreEvent } = require('./constants')
const { calculateFreeTime } = require('./streaming-core')
const { sleep } = require('../auxiliary')
const { poll } = require('./streaming-core')

const deliverEventsToConsumer = ({ emitter, events, nextCheckpoint }) =>
  new Promise((resolve) => {
    log.debug(`Delivering`, {
      nextCheckpoint,
    })

    emitter.emit('eventsAppeared', {
      events,
      checkpoint: nextCheckpoint,
      ack: resolve,
    })
  })

const retrieveEventsSinceLastCheckpoint = ({
  client,
  currentCheckpoint,
  batchSize,
}) =>
  client
    .query(
      `
      select stream_id, event_type, event_payload, global_index, timestamp from pg_journal_events where global_index > $1
      order by global_index limit $2
  `,
      [currentCheckpoint, batchSize]
    )
    .then((rows) => rows.map(unmarshalEvent))

const tap = (value) => (data) => {
  console.log(value, data)
  return data
}
module.exports = ({ client }) => ({
  subscribeToAll: ({ batchSize = 500, pollInterval = 250, lastCheckpoint }) => {
    assert.typeOf(lastCheckpoint, 'bigint')

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
            .then(tap('events'))
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
