const { PostgresClient } = require('../../../postgres-client/src')
const { PostgresProjector } = require('../../../projector-postgres/src/store')
require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '..', '..', '.env'),
})

const { EventStore } = require('../../../event-store')

const client = PostgresClient({
  connectionString: process.env.POSTGRES_PROJECTION_STORE_DATABASE_URL,
})
const eventStore = EventStore({
  connectionString: process.env.EVENT_STORE_DATABASE_URL,
})
const postgresProjector = PostgresProjector({
  eventStore,
  connectionOptions: {
    client,
  },
})

module.exports = {
  client,
  eventStore,
  postgresProjector,
}
