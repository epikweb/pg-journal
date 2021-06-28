const { assert } = require('chai')
const { pipe } = require('../auxiliary')
const { findVisibleEvents } = require('./gap-detection')
const { CoreEvent } = require('./constants')

module.exports.calculateNextCheckpoint = (currentCheckpoint, events) =>
  events.length > 0
    ? parseInt(events[events.length - 1].globalIndex, 10)
    : currentCheckpoint

module.exports.unmarshalEvents = (rows) =>
  rows.map((row) => ({
    aggregateId: row.aggregate_id,
    type: row.event_type,
    payload: row.event_payload,
    globalIndex: parseInt(row.global_index, 10),
    timestamp: row.timestamp,
  }))

const marshalEvents = (events) =>
  events.map(({ aggregateId, type, payload }) => ({
    aggregateId,
    type,
    payload,
  }))

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
    (visibleEvents) =>
      visibleEvents.length > 0
        ? [
            {
              type: CoreEvent.ConsumerDeliveryRequested,
              payload: {
                events: marshalEvents(visibleEvents),
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
