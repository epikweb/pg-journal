const { ExpectedVersion } = require('../constants')
const { getStorageTable } = require('./stream-core')
const { unmarshalEvent } = require('../event/event-core')
const { db } = require('fact-pg-client/src/client')
const { deepFreeze } = require('../auxiliary')
const { pipe } = require('../auxiliary')

const unmarshalStream = (rows) => {
  if (rows.length === 0) {
    return {
      events: [],
      expectedVersion: ExpectedVersion.NoStream,
    }
  }

  return {
    events: pipe(
      () =>
        rows.reduce((events, item) => [...events, unmarshalEvent(item)], []),
      deepFreeze
    )(),
    expectedVersion: BigInt(rows[rows.length - 1].sequence_number, 10),
  }
}

const retrieveStream = ({ client, streamId, storageTable }) =>
  client.query(
    `
    select stream_id, event_type, event_payload, global_index, sequence_number, timestamp from ${storageTable} where stream_id = $1 order by sequence_number asc
  `,
    [streamId]
  )

module.exports = ({ client, isSystemStream }) => ({
  readStreamForwards: async ({ streamId }) =>
    retrieveStream({
      client,
      streamId,
      storageTable: getStorageTable(isSystemStream),
    }).then(unmarshalStream),
})
