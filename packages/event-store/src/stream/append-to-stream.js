/*  eslint-disable camelcase */

const { ExpectedVersion } = require('../constants')
const { prepareInsertSql } = require('./append-to-stream-core')
const { handleError, checkPreconditions } = require('./append-to-stream-core')
const { sleep } = require('../auxiliary')

const getExpectedVersion = (client, streamId) =>
  client
    .single(
      `select max(sequence_number) as expected_version 
            from pg_journal_events where stream_id = $1`,
      [streamId]
    )
    .then(({ expected_version }) =>
      expected_version
        ? BigInt(expected_version) + 1n
        : ExpectedVersion.NoStream
    )

module.exports = ({ client }) => ({
  appendToStream: async ({ streamId, events, expectedVersion }) => {
    checkPreconditions({ streamId, events, expectedVersion })

    return (
      expectedVersion
        ? Promise.resolve(expectedVersion)
        : getExpectedVersion(client, streamId)
    ).then(
      (expectedVersion) =>
        new Promise((resolve, reject) =>
          // eslint-disable-next-line consistent-return
          (async function run(attemptsMade = 0) {
            try {
              const sql = prepareInsertSql({
                attemptsMade,
                events,
                expectedVersion,
                streamId,
                now: new Date(),
              })

              await client.query(sql)

              resolve()
            } catch (err) {
              console.error(err)
              const { instruction, data } = handleError({
                err,
                attemptsMade,
              })

              if (instruction === 'sleepThenRetry') {
                await sleep(data.backoffDelay)
                return run(attemptsMade + 1)
              }

              reject(new Error(data.msg))
            }
          })()
        )
    )
  },
})
