const { Pool, Client } = require('pg')
const { runQuery } = require('./transaction-context')
const { log } = require('./logging')
const { transactionContext } = require('./transaction-context')

module.exports.PostgresClient = ({
  connectionString,
  poolSize,
  loggingEnabled = true,
}) => {
  const parsedConnectionString = require('pg-connection-string').parse(
    connectionString
  )
  const { database } = parsedConnectionString

  const pool = new Pool({
    connectionString,
    max: poolSize,
  })

  const connectForDdl = async () => {
    const client = new Client({
      ...parsedConnectionString,
      database: 'postgres',
    })
    await client.connect()
    return client
  }

  return {
    ...transactionContext({ pool, loggingEnabled }),
    dropDatabase: () =>
      connectForDdl().then((client) =>
        runQuery(
          client,
          `
            SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = '${database}'
            AND pid <> pg_backend_pid();
      `
        )
          .catch((err) =>
            log.error(
              `Unable to terminate connections to ${database}, does it exist?`,
              err
            )
          )
          .then(() =>
            runQuery(client, `drop database ${database};`).catch((err) =>
              log.error(`Unable to drop db, does it exist?`, err)
            )
          )
          .then(() => client.end())
      ),
    createDatabase: () =>
      connectForDdl().then((client) =>
        runQuery(client, `create database ${database};`)
          .catch((err) =>
            log.error(`Unable to create db, does it already exist?`, err)
          )
          .then(() => client.end())
      ),
    close: () => pool.end(),
  }
}
