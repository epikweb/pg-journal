// eslint-disable-next-line import/no-extraneous-dependencies
const { migrateDatabase } = require('../../../projector-postgres/src/install')
const {
  PostgresClient,
  PostgresDdlClient,
} = require('../../../postgres-client/src')

require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '..', '..', '.env'),
})

const connectionString = process.env.POSTGRES_PROJECTION_STORE_DATABASE_URL

const ddlClient = PostgresDdlClient({
  connectionString,
})
const client = PostgresClient({
  connectionString,
})

module.exports = {
  client,
  resetTables: () =>
    client.query(`
      truncate table ledgers restart identity;
      truncate table pg_journal_events restart identity;
      truncate table pg_journal_snapshots restart identity;
      truncate table pg_journal_tags restart identity;
    `),
}
