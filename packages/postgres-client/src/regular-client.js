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

  const ctx = transactionContext()
  ctx.registerConnectionPool(pool)

  return {
    query: ctx.query,
    beginTransaction: (callback) =>
      ctx.beginTransaction().then(() => {
        const begin = () =>
          ctx.query(`START TRANSACTION ISOLATION LEVEL READ COMMITTED`)
        const commit = () => ctx.query(`COMMIT`)
        const rollback = () => ctx.query(`ROLLBACK`)

        return ctx
          .query(begin)
          .then(callback)
          .then(commit)
          .catch(rollback)
          .finally(ctx.endTransaction)
      }),
    close: () => pool.end(),
  }
}
