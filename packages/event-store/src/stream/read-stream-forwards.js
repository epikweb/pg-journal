const { unmarshalEvent } = require('../event/event-core')
const { db } = require('@pg-journal/postgres-client/src/client')
const { deepFreeze } = require('../auxiliary')
const { pipe } = require('../auxiliary')

const unmarshalStream = (rows) => {
  if (rows.length === 0) {
    return {
      events: [],
      expectedVersion: 0,
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

const retrieveStream = ({ client, streamId }) =>
  client.query(
    `
    select * from pg_journal_events where stream_id = $1 order by sequence_number asc
  `,
    [streamId]
  )

module.exports = ({ client }) => ({
  readStreamForwards: async ({ streamId }) =>
    retrieveStream({ client, streamId }).then(unmarshalStream),
})
