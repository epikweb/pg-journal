require('dotenv').config()
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL
const eventStorePool = new Pool({
  connectionString,
})
const projectionStorePool = new Pool({
  connectionString,
})
module.exports = {
  eventStorePool,
  projectionStorePool,
  arrangeDatabase: async () =>
    Promise.all([
      eventStorePool.query(`
      truncate table pg_journal_events restart identity;
      truncate table pg_journal_snapshots restart identity;
      truncate table pg_journal_tags restart identity;
    `),
      projectionStorePool.query(`
      truncate table player_backpacks restart identity;
      truncate table top_items_in_backpacks restart identity;
      truncate table available_items restart identity;
    `),
    ]),
}
