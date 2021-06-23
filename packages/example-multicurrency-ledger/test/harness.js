const {
  postgresProjectorClient,
} = require('../src/_infrastructure/postgres-projector')
const { eventStoreClient } = require('../src/_infrastructure/event-store')

module.exports = {
  resetTables: () =>
    Promise.all([
      eventStoreClient.query(`
      truncate table pg_journal_events restart identity;
      truncate table pg_journal_snapshots restart identity;
      truncate table pg_journal_tags restart identity;
    `),
      postgresProjectorClient.query(`
      truncate table ledgers restart identity;
      truncate table pg_journal_projection_state restart identity;
    `),
    ]),
}
