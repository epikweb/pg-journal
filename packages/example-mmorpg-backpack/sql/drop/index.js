require('dotenv').config()
const { log } = require('../../src/logging')

const { Client } = require('pg')
const { user, password, host, port, database } =
  require('pg-connection-string').parse(process.env.DATABASE_URL)

const client = new Client({
  user,
  password,
  host,
  port,
  database: 'postgres',
})

module.exports.dropDatabase = async () => {
  const start = Date.now()

  await client.connect()
  await client.query(`
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${database}'
      AND pid <> pg_backend_pid();
  `)
  await client.query(`drop database ${database};`).catch((err) => {
    log.error(`Unable to drop db, does it exist?`, err)
  })
  await client.end()
  log.debug(`Database "${database}" - dropped +${Date.now() - start}ms`)
}
