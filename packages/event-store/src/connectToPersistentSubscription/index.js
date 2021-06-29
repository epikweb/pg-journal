const { log } = require('../logging')
const { prepareInsertSql } = require('./core')
const { handleError, checkPreconditions } = require('./core')
const { sleep } = require('../auxiliary')

module.exports = ({ client }) => ({
  connectToPersistentSubscription: ({
    aggregateId,
    events,
    expectedVersion,
  }) => {
    checkPreconditions({ aggregateId, events, expectedVersion })

    return new Promise((resolve, reject) =>
      // eslint-disable-next-line consistent-return
      (async function run(attemptsMade = 0) {
        try {
          const sql = prepareInsertSql({
            attemptsMade,
            events,
            expectedVersion,
            aggregateId,
            now: new Date(),
          })

          await client.query(sql)

          resolve()
        } catch (err) {
          const { instruction, data } = handleError({ err, attemptsMade })

          if (instruction === 'sleepThenRetry') {
            await sleep(data.backoffDelay)
            return run(attemptsMade + 1)
          }

          reject(new Error(data.msg))
        }
      })()
    )
  },
})
