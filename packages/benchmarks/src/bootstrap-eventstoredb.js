const waitOn = require('wait-on')
const { sleep } = require('./core')
const { EventStoreDBClient } = require('@eventstore/db-client')
const { runCommand } = require('./harness')

const port = 36001
const containerName = 'eventstoredb'
module.exports.bootstrapEventStoreDb = ({ image, dockerFlags }) =>
  runCommand('docker', ['stop', containerName])
    .then(() => runCommand('docker', ['rm', containerName]))
    .then(() =>
      runCommand('docker', [
        'run',
        '--name',
        containerName,
        ...dockerFlags,
        '-p',
        `${port}:2113`,
        '-p',
        `${port + 1}:1113`,
        '-d',
        image,
      ])
    )
    .then(() =>
      waitOn({
        resources: [`tcp:${port}`],
        verbose: true,
        delay: 5000,
      })
    )
    .then(() => {
      const client = new EventStoreDBClient(
        {
          endpoint: `localhost:${port}`,
        },
        {
          insecure: true,
        }
      )
      EventStoreDBClient.prototype.close = () =>
        sleep(2000).then(() =>
          runCommand('docker', ['stop', containerName]).then(() =>
            waitOn({
              resources: [`tcp:${port}`],
              reverse: true,
            })
          )
        )
      return client
    })
