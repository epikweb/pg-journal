const { installEventStore, EventStore } = require('..')
const { PostgresClient } = require('fact-pg-client')
const { spawn } = require('child_process')
const { uninstallEventStore } = require('../index')

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

module.exports.arrangeEventStore = (options = {}) =>
  runCommand('docker-compose', ['up', '-d']).then(async function retry() {
    const client = PostgresClient({
      connectionString: `postgres://user:password@localhost:34921/database`,
      poolSize: 5,
      loggingEnabled: false,
    })
    await uninstallEventStore({ client })
      .then(() => installEventStore({ client }))
      .catch((err) => {
        console.error(err)
        return new Promise((resolve) => setTimeout(resolve, 500)).then(retry)
      })

    const eventStore = EventStore({ client, ...options })

    return {
      ...eventStore,
      client,
    }
  })
