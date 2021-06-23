const { marshalEvents } = require('./core')
const { unmarshalEvents } = require('./core')
const { calculateNextCheckpoint } = require('./core')

const retrieveEventsSinceLastCheckpoint = ({
  schemaName,
  client,
  checkpoint,
  batchSize,
}) =>
  client
    .query(
      `
      select * from ${schemaName}.pg_journal_events where global_index > $1
      order by global_index limit $2
  `,
      [checkpoint, batchSize]
    )
    .then(unmarshalEvents)

module.exports.takeNextEventBatch = async ({
  client,
  schemaName,
  checkpoint,
  batchSize,
}) => {
  const events = await retrieveEventsSinceLastCheckpoint({
    client,
    schemaName,
    checkpoint,
    batchSize,
  })

  const nextCheckpoint = calculateNextCheckpoint(checkpoint, events)

  return {
    events: marshalEvents(events),
    nextCheckpoint,
  }
}
