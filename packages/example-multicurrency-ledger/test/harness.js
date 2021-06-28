const { postgresProjectorClient } = require('../src/_infrastructure')
const { eventStoreClient } = require('../src/_infrastructure')

module.exports = {
  resetTables: () =>
    Promise.all([
      eventStoreClient.query(`
          delete from pg_journal_events;
          delete from pg_journal_snapshots;
          delete from pg_journal_tags;

          select setval('pg_journal_events_global_index_seq', 1, false);
    `),
      postgresProjectorClient.query(`
        delete from ledgers;
        delete from pg_journal_projection_state;
      `),
    ]),
}
