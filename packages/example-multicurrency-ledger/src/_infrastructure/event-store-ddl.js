const { PostgresDdlClient } = require('@pg-journal/postgres-client')
const { eventStoreConnectionString } = require('./config')

const eventStoreDdlClient = PostgresDdlClient({
  connectionString: eventStoreConnectionString,
})

module.exports = {
  eventStoreDdlClient,
}
