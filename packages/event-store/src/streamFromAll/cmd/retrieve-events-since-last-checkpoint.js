const { unmarshalEvents } = require('../core')

module.exports.retrieveEventsSinceLastCheckpoint = ({
  client,
  currentCheckpoint,
  batchSize,
}) =>
  client
    .query(
      `
      select * from pg_journal_events where global_index > $1
      order by global_index limit $2
  `,
      [currentCheckpoint, batchSize]
    )
    .then(unmarshalEvents)
