const { PostgresDdlClient } = require('@pg-journal/postgres-client')
const { postgresProjectorConnectionString } = require('./config')

const postgresProjectorDdlClient = PostgresDdlClient({
  connectionString: postgresProjectorConnectionString,
})

module.exports = {
  postgresProjectorDdlClient,
}
