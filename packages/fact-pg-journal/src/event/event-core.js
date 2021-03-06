/* eslint-disable */

module.exports.unmarshalEvent = ({
  stream_id,
  event_type,
  event_payload,
  sequence_number,
  global_index,
  timestamp,
}) => ({
  streamId: stream_id,
  type: event_type,
  payload: event_payload,
  sequenceNumber: BigInt(sequence_number),
  globalIndex: BigInt(global_index),
  timestamp,
})

module.exports.marshalEvent = ({
  streamId,
  type,
  payload,
  sequenceNumber,
}) => ({
  streamId,
  type,
  payload,
  sequenceNumber,
})
