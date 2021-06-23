require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '..', '..', '.env.test'),
})

const { PostgresDdlClient, PostgresClient } = require('../../postgres-client')

const connectionString = process.env.COMMAND_DATABASE_URL

const ddlClient = PostgresDdlClient({
  connectionString,
})
const client = PostgresClient({
  connectionString,
})

const schemaName = 'event_store_test'

module.exports = {
  client,
  ddlClient,
  schemaName,
  connectionString,
}
