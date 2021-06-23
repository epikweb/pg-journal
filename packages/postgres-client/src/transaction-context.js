const { v4 } = require('uuid')
const { AsyncLocalStorage } = require('async_hooks')
const { log } = require('./logging')

const query = (client, sql, params, transactionId) => {
  log.info(`
=====================================================
Transaction ID: ${transactionId || 'default'}

${sql.trim()}${
    params
      ? `\n\n${params
          .map((_, index) => `$${index + 1} = ${params[index]}\n`)
          .join('')}`
      : ''
  }
=====================================================
`)

  return client.query(sql, params).then(({ rows }) => rows)
}

module.exports.transactionContext = (pool) => {
  const localStorage = new AsyncLocalStorage()

  return {
    beginTransaction: async (callback) => {
      const transactionId = v4()
      const client = await pool.connect()
      log.info(`Entering tx with ID ${transactionId}`)

      await query(
        client,
        `START TRANSACTION ISOLATION LEVEL READ COMMITTED`,
        null,
        transactionId
      )
      return localStorage
        .run(
          {
            transactionId,
            client,
          },
          callback
        )
        .then(() => query(client, `COMMIT`, null, transactionId))
        .catch((err) =>
          query(client, `ROLLBACK`, null, transactionId).then(() => {
            throw err
          })
        )
    },
    query: (sql, params) => {
      const state = localStorage.getStore()
      return query(
        state ? state.client : pool,
        sql,
        params,
        state ? state.transactionId : null
      )
    },
  }
}
