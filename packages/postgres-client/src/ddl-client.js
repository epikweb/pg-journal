const { Pool } = require('pg')
const { parse } = require('pg-connection-string')
const { log } = require('./logging')

module.exports.PostgresDdlClient = ({ connectionString }) => {
  const parsedConnectionString = parse(connectionString)
  const pool = new Pool({
    ...parsedConnectionString,
    database: 'postgres',
  })

  const query = (sql) => {
    log.info(`
=====================================================
DDL Transaction ID: default

${sql.trim()}
=====================================================
`)
    return pool.query(sql)
  }

  return {
    dropDatabase: () =>
      query(`drop database ${parsedConnectionString.database};`).catch((err) =>
        log.error(`Unable to drop db, does it exist?`, err)
      ),
    createDatabase: () =>
      query(`create database ${parsedConnectionString.database};`).catch(
        (err) => log.error(`Unable to create db, does it already exist?`, err)
      ),
    close: () => pool.end(),
  }
}
