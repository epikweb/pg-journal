const { v4 } = require('uuid')
const { assert } = require('chai')
const { AsyncLocalStorage } = require('async_hooks')
const { log } = require('./logging')

module.exports.transactionContext = () => {
  const localStorage = new AsyncLocalStorage()

  return {
    registerConnectionPool: (pool) =>
      localStorage.enterWith({
        pool,
        client: pool,
        isInTransaction: false,
      }),
    beginTransaction: async () => {
      const { pool } = localStorage.getStore()

      localStorage.enterWith({
        pool,
        transactionId: v4(),
        client: await pool.connect(),
        isInTransaction: true,
      })
    },
    endTransaction: async () => {
      const { pool, inTransaction } = localStorage.getStore()
      assert.equal(inTransaction, true)

      localStorage.enterWith({
        pool,
        client: pool,
        isInTransaction: false,
      })
    },
    query: (sql, params) => {
      const { client, isInTransaction, transactionId } = localStorage.getStore()

      log.info(`
=====================================================
Transaction ID: ${!isInTransaction ? 'default' : transactionId}

${sql.trim()}${
        params
          ? `\n\n${params
              .map((_, index) => `$${index + 1} = ${params[index]}\n`)
              .join('')}`
          : ''
      }
=====================================================
`)

      return client.query(sql, params)
    },
  }
}
