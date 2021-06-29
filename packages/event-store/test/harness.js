require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '.env.test'),
})

const { EventStore } = require('../index')
const { PostgresClient } = require('@pg-journal/postgres-client')

const connectionString = process.env.EVENT_STORE_CONNECTION_STRING

const client = PostgresClient({
  connectionString,
})

module.exports = {
  cleanTables: () =>
    client.query(`
      truncate table pg_journal_events restart identity;
      truncate table pg_journal_snapshots restart identity;
      truncate table pg_journal_system_projections restart identity;
    `),
  constructEventStore: (options = {}) => EventStore({ client, ...options }),
  client,
}
