// eslint-disable-next-line import/no-extraneous-dependencies

const { client } = require('./config')

module.exports = {
  client,
  resetTables: () =>
    client.query(`
      truncate table pg_journal_events restart identity;
      truncate table pg_journal_snapshots restart identity;
      truncate table pg_journal_tags restart identity;
    `),
}
