const { v4 } = require('uuid')
const { AsyncLocalStorage } = require('async_hooks')
const { log } = require('./logging')

module.exports.runQuery = (
  client,
  sql,
  options = { params: [], transactionId: null, loggingEnabled: true }
) => {
  if (options.loggingEnabled) {
    log.info(`
=====================================================
Transaction ID: ${options.transactionId || 'None'}

${sql.trim()}${
      options.params
        ? `\n\n${options.params
            .map((_, index) => `$${index + 1} = ${options.params[index]}\n`)
            .join('')}`
        : ''
    }
=====================================================
`)
  }
  return client.query(sql, options.params).then(({ rows }) => rows)
}

const runTransactionalQuery = (
  sql,
  params,
  { transactionState, loggingEnabled }
) => {
  const { transactionId, client } = transactionState
  return module.exports.runQuery(client, sql, {
    transactionId,
    loggingEnabled,
    params,
  })
}

const runQueryFromPool = async (sql, params, { pool, loggingEnabled }) => {
  const client = await pool.connect()
  return module.exports
    .runQuery(client, sql, {
      params,
      loggingEnabled,
    })
    .finally(() => client.release())
}

module.exports.transactionContext = ({ pool, loggingEnabled }) => {
  const localStorage = new AsyncLocalStorage()

  const query = async (sql, params) => {
    const transactionState = localStorage.getStore()

    return transactionState
      ? runTransactionalQuery(sql, params, { transactionState, loggingEnabled })
      : runQueryFromPool(sql, params, { pool, loggingEnabled })
  }

  return {
    beginTransaction: async (
      callback,
      options = { isolationLevel: 'READ COMMITTED' }
    ) => {
      const transactionId = v4()
      const client = await pool.connect()

      return localStorage.run(
        {
          transactionId,
          client,
        },
        () =>
          query(`START TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`)
            .then(callback)
            .then(() => query('COMMIT'))
            .catch((err) => query('ROLLBACK').then(() => Promise.reject(err)))
            .finally(() => client.release())
      )
    },
    query,
    single: (sql, params) => query(sql, params).then((rows) => rows[0]),
  }
}
