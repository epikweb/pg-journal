module.exports.calculateNextCheckpoint = (lastCheckpoint, events) =>
  events.length > 0
    ? parseInt(events[events.length - 1].globalIndex, 10)
    : lastCheckpoint

module.exports.calculateFreeTime = ({
  now = Date.now(),
  start,
  pollInterval,
}) => {
  const duration = now - start
  return pollInterval - duration
}

module.exports.unmarshalEvents = ({ rows }) =>
  rows.map((row) => ({
    aggregateId: row.aggregate_id,
    type: row.event_type,
    payload: row.event_payload,
    globalIndex: row.global_index,
  }))

module.exports.marshalEvents = (events) =>
  events.map(({ aggregateId, type, payload }) => ({
    aggregateId,
    type,
    payload,
  }))
