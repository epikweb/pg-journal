require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '.env.test'),
})

const { PostgresDdlClient, PostgresClient } = require('../../postgres-client')

const connectionString = process.env.EVENT_STORE_CONNECTION_STRING

const ddlClient = PostgresDdlClient({
  connectionString,
})
const client = PostgresClient({
  connectionString,
})

module.exports = {
  client,
  ddlClient,
  connectionString,
}
