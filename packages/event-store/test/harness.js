const { client, schemaName } = require('./config')

module.exports = {
  cleanTables: () =>
    client.query(`
      truncate table ${schemaName}.pg_journal_events restart identity;
      truncate table ${schemaName}.pg_journal_snapshots restart identity;
      truncate table ${schemaName}.pg_journal_tags restart identity;
    `),
}
