require('dotenv').config()

const { Client } = require('pg')
const { user, password, host, port, database } =
  require('pg-connection-string').parse(process.env.DATABASE_URL)

const { log } = require('../../src/logging')

const client = new Client({
  user,
  password,
  host,
  port,
  database: 'postgres',
})

module.exports.createDatabase = async () => {
  const start = Date.now()

  await client.connect()
  await client.query(`create database ${database};`).catch((err) => {
    log.error(`Unable to create db, does it already exist?`, err)
  })
  log.debug(`Database "${database}" - created +${Date.now() - start}ms`)
  await client.end()
}
