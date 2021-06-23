const { client } = require('./config')

module.exports = {
  cleanTables: () =>
    client.query(`
      truncate table pg_journal_events restart identity;
      truncate table pg_journal_snapshots restart identity;
      truncate table pg_journal_tags restart identity;
    `),
}
