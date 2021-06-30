const { PostgresClient } = require('@fact/pg-client')
const { spawn } = require('child_process')
const { uninstallPostgresProjector } = require('@fact/pg-projector')
const { uninstallEventStore } = require('@fact/pg-journal')
const { installPostgresProjector } = require('@fact/pg-projector')
const { installEventStore } = require('@fact/pg-journal')

const runCommand = (cmd, args, env) => {
  console.log(`Running shell cmd`, cmd, args)
  const ls = spawn(cmd, args, {
    env: {
      ...process.env,
      ...env,
    },
    cwd: __dirname,
  })

  return new Promise((resolve, reject) => {
    ls.stdout.on('data', (data) => {
      console.log(`stdout: ${data.toString()}`)
    })

    ls.stderr.on('data', (data) => {
      console.log(`stderr: ${data.toString()}`)
      if (data.toString().includes('No such container')) {
        resolve()
      }
    })

    ls.on('exit', (code) => {
      console.log(`child process exited with code ${code.toString()}`)
      if (code === 0) {
        resolve()
      }
    })
  })
}

module.exports.arrangeSut = () =>
  runCommand('docker-compose', ['up', '-d']).then(async function retry() {
    const eventStoreConnectionString = process.env.EVENT_STORE_CONNECTION_STRING
    const eventStoreClient = PostgresClient({
      connectionString: eventStoreConnectionString,
      poolSize: 5,
      loggingEnabled: false,
    })

    const postgresProjectorConnectionString =
      process.env.POSTGRES_PROJECTOR_CONNECTION_STRING
    const postgresProjectorClient = PostgresClient({
      connectionString: postgresProjectorConnectionString,
      poolSize: 5,
      loggingEnabled: false,
    })

    return Promise.all([
      uninstallEventStore({ client: eventStoreClient }),
      uninstallPostgresProjector({ client: postgresProjectorClient }),
      require('../src/_infrastructure/2021-06-22-initial-migration').down({
        client: postgresProjectorClient,
      }),
    ])
      .then(() =>
        Promise.all([
          installEventStore({ client: eventStoreClient }),
          installPostgresProjector({
            client: postgresProjectorClient,
          }),
          require('../src/_infrastructure/2021-06-22-initial-migration').up({
            client: postgresProjectorClient,
          }),
        ])
      )
      .catch((err) => {
        console.error(err)
        return new Promise((resolve) => setTimeout(resolve, 500)).then(retry)
      })
  })
