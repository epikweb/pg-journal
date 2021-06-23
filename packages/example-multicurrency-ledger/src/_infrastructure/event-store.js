const { PostgresClient } = require('@pg-journal/postgres-client')
const { EventStore } = require('@pg-journal/event-store')
const { eventStoreConnectionString } = require('./config')

const eventStoreClient = PostgresClient({
  connectionString: eventStoreConnectionString,
})
const eventStore = EventStore({
  client: eventStoreClient,
})

module.exports = {
  eventStore,
  eventStoreClient,
}
