const { marshalEvents } = require('./core')
const { unmarshalEvents } = require('./core')
const { calculateNextCheckpoint } = require('./core')

const retrieveEventsSinceLastCheckpoint = ({ client, checkpoint, batchSize }) =>
  client
    .query(
      `
      select * from pg_journal_events where global_index > $1
      order by global_index limit $2
  `,
      [checkpoint, batchSize]
    )
    .then(unmarshalEvents)

module.exports.takeNextEventBatch = async ({
  client,
  checkpoint,
  batchSize,
}) => {
  const events = await retrieveEventsSinceLastCheckpoint({
    client,
    checkpoint,
    batchSize,
  })

  const nextCheckpoint = calculateNextCheckpoint(checkpoint, events)

  return {
    events: marshalEvents(events),
    nextCheckpoint,
  }
}
