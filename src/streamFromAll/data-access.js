const { Pool } = require('pg')
const { log } = require('../logging')
const { StreamPosition } = require('../constants')
const { unmarshalEvents } = require('./core')

module.exports.retrieveEventsSinceLastCheckpoint = ({
  pool,
  checkpoint,
  batchSize,
}) => {
  const sql = `
      select * from pg_journal_events where global_index > $1
      order by global_index limit $2
  `
  log.debug(sql, [checkpoint, batchSize])

  return pool.query(sql, [checkpoint, batchSize]).then(unmarshalEvents)
}

module.exports.findOrRegisterLastCheckpoint = ({ pool, subscriptionName }) =>
  pool
    .query(
      `
                insert into pg_journal_projections(checkpoint, name)
                values($1, $2)
                on conflict(name) do nothing
                returning checkpoint
      `,
      [StreamPosition.Start, subscriptionName]
    )
    .then(({ rows }) => rows[0].checkpoint)

module.exports.beginTransaction = ({ pool }, callback) =>
  pool.connect().then(async (client) => {
    client.query(`START TRANSACTION ISOLATION LEVEL READ COMMITTED`).then(() =>
      callback({
        query: client.query,
        rollback: () => client.query(`ROLLBACK`),
        commit: () => client.query(`COMMIT`),
      }).then(() => client.end())
    )
  })

module.exports.advanceCheckpoint = async (
  { pool },
  { subscriberName, checkpoint }
) => {
  const sql = `
      UPDATE pg_journal_projections
      SET checkpoint = $1
      WHERE name = $2`

  await pool.query(sql, [checkpoint, subscriberName])
}
