const { advanceCheckpoint } = require('./checkpoint')
const { findOrRegisterLastCheckpoint } = require('./data-access')
const { calculateFreeTime } = require('./core')
const { log } = require('../logging')
const { sleep } = require('../auxiliary')

module.exports = ({ eventStorePool, projectionStorePool }) => ({
  streamFromAll: async ({
    batchSize = 500,
    pollInterval = 250,
    projectEvents = () => {},
    subscriptionName = 'a really cool projection',
  }) => {
    const lastCheckpoint = await findOrRegisterLastCheckpoint({
      projectionStorePool,
      subscriptionName,
    })

    log.debug(`${subscriptionName} left off at checkpoint: ${lastCheckpoint}`)
    return (async function poll(checkpoint, start = Date.now()) {
      log.debug(`==== BEGIN POLL ====`)
      await advanceCheckpoint({
        eventStorePool,
        projectionStorePool,
        subscriptionName,
        checkpoint,
        projectEvents,
        lastCheckpoint,
        batchSize,
      })
      const freeTime = calculateFreeTime({ start, pollInterval })
      await sleep(freeTime)
      log.debug(`==== END POLL ====`)
    })(lastCheckpoint)
  },
})
