require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '.env.test'),
})

const { PostgresDdlClient, PostgresClient } = require('..')

const connectionString = process.env.CONNECTION_STRING

const ddlClient = PostgresDdlClient({
  connectionString,
})
const client = PostgresClient({
  connectionString,
})

module.exports = {
  client,
  ddlClient,
}
