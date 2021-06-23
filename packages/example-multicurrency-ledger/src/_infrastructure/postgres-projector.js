const { PostgresClient } = require('@pg-journal/postgres-client')
const { PostgresProjector } = require('@pg-journal/postgres-projector')
const { postgresProjectorConnectionString } = require('./config')
const { eventStoreConnectionString } = require('./config')

const postgresProjectorClient = PostgresClient({
  connectionString: postgresProjectorConnectionString,
})

const postgresProjector = PostgresProjector({
  eventStoreConnectionOptions: {
    connectionString: eventStoreConnectionString,
  },
  connectionOptions: {
    client: postgresProjectorClient,
  },
})

module.exports = {
  postgresProjector,
  postgresProjectorClient,
}
