const { spawn } = require('child_process')
const { connectionUrls } = require('./_config')
const { EventStoreDBClient, jsonEvent } = require('@eventstore/db-client')

const runCommand = (cmd, args, env) => {
  console.log(cmd, args)
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
    })

    ls.on('exit', (code) => {
      console.log(`child process exited with code ${code.toString()}`)
      if (code === 0) {
        resolve()
      }
    })
  })
}

const port = 36001
const eventStoreDbClient = new EventStoreDBClient(
  {
    endpoint: `localhost:${port}`,
  },
  {
    insecure: true,
  }
)
module.exports = {
  jsonEvent,
  eventStoreDbClient,
  restartDockerContainer: () =>
    runCommand('docker-compose', ['stop', 'eventstoredb_event_store'])
      .then(() =>
        runCommand('docker-compose', ['start', 'eventstoredb_event_store'])
      )
      .then(() =>
        runCommand(/^win/.test(process.platform) ? `npx.cmd` : `npx`, [
          'wait-on',
          `tcp:${port}`,
        ])
      ),
}
