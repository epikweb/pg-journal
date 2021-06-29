const { installEventStore } = require('@pg-journal/event-store')
const { EventStore } = require('@pg-journal/event-store')
const { PostgresClient } = require('@pg-journal/postgres-client')
const { runCommand } = require('./harness')
const waitOn = require('wait-on')
const { sleep } = require('./core')

const port = 36000
const containerName = 'pg_journal'
module.exports.bootstrapPgJournal = ({ poolSize, image, dockerFlags = [] }) =>
  runCommand('docker', ['stop', containerName])
    .then(() => runCommand('docker', ['rm', containerName]))
    .then(() =>
      runCommand('docker', [
        'run',
        '--name',
        containerName,
        '-e',
        'POSTGRES_USER=user',
        '-e',
        'POSTGRES_PASSWORD=password',
        '-e',
        'POSTGRES_DB=database',
        ...dockerFlags,
        '-p',
        `${port}:5432`,
        '-d',
        image,
        '-c',
        'max_connections=500',
      ])
    )
    .then(() =>
      waitOn({
        resources: [`tcp:${port}`],
        verbose: true,
        delay: 5000,
      })
    )
    .then(async () => {
      const client = PostgresClient({
        connectionString: `postgres://user:password@localhost:${port}/database`,
        poolSize,
        loggingEnabled: false,
      })
      const eventStore = EventStore({ client })

      await client
        .dropDatabase()
        .then(client.createDatabase)
        .then(() => installEventStore({ client }))

      return {
        ...eventStore,
        client,
        close: () =>
          client
            .close()
            .then(() => {
              console.log('Client closed, shutting down docker container')

              return runCommand('docker', ['stop', containerName])
            })
            .then(() =>
              waitOn({
                resources: [`tcp:${port}`],
                reverse: true,
              })
            ),
      }
    })
