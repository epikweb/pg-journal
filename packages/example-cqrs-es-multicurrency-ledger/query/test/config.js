const {
  PostgresDdlClient,
  PostgresClient,
} = require('../../../postgres-client/src')

require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '..', '..', '.env.test'),
})

const commandConnectionString = process.env.COMMAND_DATABASE_URL
const queryConnectionString = process.env.QUERY_DATABASE_URL

const commandDdlClient = PostgresDdlClient({
  connectionString: commandConnectionString,
})
const queryDdlClient = PostgresDdlClient({
  connectionString: queryConnectionString,
})

const client = PostgresClient({
  connectionString,
})

const schemaName = 'example_multicurrency_ledger_test'

module.exports = {
  client,
  ddlClient,
  schemaName,
  connectionString,
}
