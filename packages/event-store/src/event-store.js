const { PostgresClient } = require('../../postgres-client')

module.exports.EventStore = (options) => {
  const client = PostgresClient(options)

  const schemaName = options.schemaName || 'public'
  return {
    ...require('./appendToStream')({ client, schemaName }),
    ...require('./readStreamForwards')({ client, schemaName }),
    ...require('./streamFromAll')({ client, schemaName }),
  }
}
