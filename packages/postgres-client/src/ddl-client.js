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
    return pool.query(sql).then(({ rows }) => rows)
  }

  return {
    dropDatabase: () =>
      query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = '${parsedConnectionString.database}'
            AND pid <> pg_backend_pid();
      `).then(() =>
        query(`drop database ${parsedConnectionString.database};`).catch(
          (err) => log.error(`Unable to drop db, does it exist?`, err)
        )
      ),
    createDatabase: () =>
      query(`create database ${parsedConnectionString.database};`).catch(
        (err) => log.error(`Unable to create db, does it already exist?`, err)
      ),
    close: () => pool.end(),
  }
}
