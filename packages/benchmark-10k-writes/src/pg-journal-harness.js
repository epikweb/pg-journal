const { connectionUrls } = require('./_config')
const { EventStore } = require('@pg-journal/event-store')
const { PostgresClient } = require('@pg-journal/postgres-client')

const eventStoreClient = PostgresClient({
  connectionString:
    'postgres://user:password@localhost:36000/benchmark_5k_writes_sec',
  poolSize: 4,
  loggingEnabled: false,
})
const eventStore = EventStore({ client: eventStoreClient })

module.exports = {
  eventStore,
  eventStoreClient,
  resetTables: () =>
    eventStoreClient.query(`
          delete from pg_journal_events;
          delete from pg_journal_snapshots;
          delete from pg_journal_tags;

          select setval('pg_journal_events_global_index_seq', 1, false);
    `),
}
