const { EventEmitter } = require('events')
const { PostgresClient } = require('../../postgres-client/src')
const { log } = require('./logging')
const { StreamPosition } = require('./constants')

const findOrRegisterCurrentCheckpoint = ({ client, name }) =>
  client
    .query(
      `
                insert into pg_journal_projection_state(checkpoint, name)
                values($1, $2)
                on conflict(name) do nothing
                returning checkpoint
      `,
      [StreamPosition.Start, name]
    )
    .then(({ rows }) => rows[0].checkpoint)

const advanceCheckpoint = async ({ client, name, checkpoint }) =>
  client.query(
    `
      UPDATE pg_journal_projection_state
      SET checkpoint = $1
      WHERE name = $2`,
    [checkpoint, name]
  )

module.exports.PostgresProjector = ({ eventStore, connectionOptions }) => {
  const client = PostgresClient(connectionOptions)
  return {
    resumeReplication: async ({ name, transformer }) => {
      const currentCheckpoint = await findOrRegisterCurrentCheckpoint({ name })
      log.debug(
        `Projection with name: ${name} left off at checkpoint ${currentCheckpoint}. Resuming streaming replication`
      )

      const plugin = new EventEmitter()
      const { stopStreaming, resumeStreaming } = eventStore.streamFromAll({
        lastCheckpoint: currentCheckpoint,
        plugin,
      })

      plugin.on('checkpointReached', ({ events, checkpoint }) =>
        client.beginTransaction(() =>
          new Promise((resolve) => {
            transformer.emit('eventsReceived', events)
            transformer.on('eventsProcessed', resolve)
          })
            .then(() => advanceCheckpoint({ name, checkpoint }))
            .then(() =>
              log.debug(
                `Projection ${name} checkpoint advanced to ${checkpoint}`
              )
            )
            .then(() => plugin.emit('checkpointAdvanced'))
            .catch((err) => log.error(`Projection error:`, err))
        )
      )

      return {
        stopStreaming,
        resumeStreaming,
      }
    },
  }
}
