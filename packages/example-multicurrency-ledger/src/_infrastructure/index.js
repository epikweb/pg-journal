const { PostgresProjector } = require('@pg-journal/postgres-projector')
const { PostgresClient } = require('@pg-journal/postgres-client')
const { EventStore } = require('@pg-journal/event-store')

const eventStoreConnectionString = process.env.EVENT_STORE_CONNECTION_STRING
const postgresProjectorConnectionString =
  process.env.POSTGRES_PROJECTOR_CONNECTION_STRING

const eventStoreClient = PostgresClient({
  connectionString: eventStoreConnectionString,
  poolSize: 4,
  loggingEnabled: true,
})
const postgresProjectorClient = PostgresClient({
  connectionString: postgresProjectorConnectionString,
  poolSize: 4,
  loggingEnabled: false,
})

const eventStore = EventStore({
  client: eventStoreClient,
})
const postgresProjector = PostgresProjector({
  eventStore,
  client: postgresProjectorClient,
})

module.exports = {
  eventStore,
  eventStoreClient,

  postgresProjector,
  postgresProjectorClient,
}
