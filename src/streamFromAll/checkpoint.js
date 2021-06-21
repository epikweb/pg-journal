const { retrieveEventsSinceLastCheckpoint } = require('./data-access')
const { calculateNextCheckpoint } = require('./core')

module.exports.takeNextEventBatch = async ({
  eventStorePool,
  checkpoint,
  batchSize,
}) => {
  const events = await retrieveEventsSinceLastCheckpoint({
    pool: eventStorePool,
    checkpoint,
    batchSize,
  })

  const nextCheckpoint = calculateNextCheckpoint(checkpoint, events)

  return {
    events,
    nextCheckpoint,
  }
}
