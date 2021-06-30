/*  eslint-disable camelcase */

const { getStorageTable } = require('./stream-core')
const { ExpectedVersion } = require('../constants')
const {
  prepareInsertSql,
  AppendToStreamEvent,
  handleError,
  checkPreconditions,
} = require('./append-to-stream-core')
const { sleep } = require('../auxiliary')

const getExpectedVersion = ({ client, streamId, storageTable }) =>
  client
    .single(
      `select max(sequence_number) as expected_version 
            from ${storageTable} where stream_id = $1`,
      [streamId]
    )
    .then(({ expected_version }) =>
      expected_version
        ? BigInt(expected_version) + 1n
        : ExpectedVersion.NoStream
    )

module.exports = ({ client, isSystemStream = false }) => ({
  appendToStream: async ({ streamId, events, expectedVersion }) => {
    checkPreconditions({ streamId, events, expectedVersion })

    const storageTable = getStorageTable(isSystemStream)
    return (
      expectedVersion
        ? Promise.resolve(expectedVersion)
        : getExpectedVersion({ client, streamId, storageTable })
    ).then(
      (expectedVersion) =>
        new Promise((resolve, reject) =>
          // eslint-disable-next-line consistent-return
          (async function run(attemptsMade = 0) {
            const sql = prepareInsertSql({
              attemptsMade,
              events,
              expectedVersion,
              streamId,
              storageTable,
              now: new Date(),
            })

            return client
              .query(sql)
              .then(resolve)
              .catch((err) =>
                Promise.resolve(handleError({ err, attemptsMade }))
                  .then((event) => {
                    switch (event.type) {
                      case AppendToStreamEvent.ConcurrencyViolationDetected:
                        return sleep(event.payload.backoffDelay).then(() =>
                          run(event.payload.nextAttempt)
                        )

                      case AppendToStreamEvent.FailedToCorrectConcurrencyViolation:
                      case AppendToStreamEvent.UnknownErrorReceived:
                      default:
                        return reject(new Error(event.payload.msg))
                    }
                  })
                  .catch(reject)
              )
          })()
        )
    )
  },
})
