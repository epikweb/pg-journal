const { instanceOfUs, constructPool } = require('./core')
const { transactionContext } = require('./transaction-context')

module.exports.PostgresClient = ({
  username,
  password,
  host,
  port,
  database,
  connectionString,
  pgPool,
  client,
}) => {
  if (instanceOfUs(client)) {
    return client
  }

  const pool = constructPool({
    username,
    host,
    port,
    database,
    connectionString,
    password,
    pgPool,
  })

  return {
    ...transactionContext(pool),
    close: () => pool.end(),
  }
}
