const { deepFreeze } = require('../auxiliary')
const { pipe } = require('../auxiliary')

const unmarshalEvent = (event) => ({
  aggregateId: event.aggregate_id,
  type: event.type,
  payload: event.payload,
  timestamp: event.created_at,
  sequenceNumber: event.sequence_number,
})

const unmarshalStream = ({ rows }) => {
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
    expectedVersion: parseInt(rows[rows.length - 1].sequence_number, 10),
  }
}

const retrieveStream = ({ pool, aggregateId }) =>
  pool
    .query(
      `
    select * from pg_journal_events where aggregate_id = $1 order by sequence_number asc
  `,
      [aggregateId]
    )
    .then(unmarshalStream)

module.exports = ({ pool }) => ({
  readStreamForwards: async ({ aggregateId }) =>
    retrieveStream({ pool, aggregateId }),
})
