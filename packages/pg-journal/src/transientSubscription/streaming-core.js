const { tap } = require('../auxiliary')
const { marshalEvent } = require('../event/event-core')
const { pipe } = require('../auxiliary')
const { findVisibleEvents } = require('./gap-detection')
const { CoreEvent } = require('./constants')

const calculateNextCheckpoint = (events) =>
  events[events.length - 1].globalIndex

module.exports.poll = ({ events, currentCheckpoint, now }) => {
  if (events.length === 0) {
    return [
      {
        type: CoreEvent.CheckpointAdvanced,
        payload: { nextCheckpoint: currentCheckpoint },
      },
    ]
  }

  return pipe(
    () =>
      findVisibleEvents({
        currentCheckpoint,
        events,
        now,
      }),
    tap('visibleEvents'),
    (visibleEvents) =>
      visibleEvents.length > 0
        ? [
            {
              type: CoreEvent.ConsumerDeliveryRequested,
              payload: {
                events: visibleEvents.map(marshalEvent),
                nextCheckpoint: calculateNextCheckpoint(visibleEvents),
              },
            },
            {
              type: CoreEvent.CheckpointAdvanced,
              payload: {
                nextCheckpoint: calculateNextCheckpoint(visibleEvents),
              },
            },
          ]
        : [
            {
              type: CoreEvent.CheckpointAdvanced,
              payload: {
                nextCheckpoint: currentCheckpoint,
              },
            },
          ]
  )()
}

module.exports.calculateFreeTime = ({ now, start, pollInterval }) =>
  pollInterval - (now - start)
