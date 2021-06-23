const {
  PostgresDdlClient,
  PostgresClient,
} = require('../../postgres-client/src')

require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '..', '..', '.env.test'),
})

const connectionString = process.env.COMMAND_DATABASE_URL

const ddlClient = PostgresDdlClient({
  connectionString,
})

const client = PostgresClient({
  connectionString,
})

const schemaName = 'example_event_sourced_multicurrency_ledger_test'

module.exports = {
  client,
  ddlClient,
  schemaName,
  connectionString,
}
