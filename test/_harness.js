require('dotenv').config()
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL
const pool = new Pool({
  connectionString,
})

module.exports = {
  connectionString,
  pool,
  arrangeDatabase: async () => {
    await pool.query(`
      truncate table pg_journal_events restart identity;
      truncate table pg_journal_projections restart identity;
      truncate table pg_journal_snapshots restart identity;
      truncate table pg_journal_tags restart identity;
    `)
  },
}
