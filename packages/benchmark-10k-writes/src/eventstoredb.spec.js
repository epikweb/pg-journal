const { prepareReport } = require('./core')
const {
  restartDockerContainer,
  eventStoreDbClient,
  jsonEvent,
} = require('./eventstoredb-harness')
const { eventsToWrite, maxDuration } = require('./_config').testOptions

describe('benchmark eventstoredb 10k writes', () => {
  it('should perform 10k writes as fast to 10k random streams as fast as possible', async () => {
    // :( https://github.com/EventStore/EventStore/issues/1328
    await restartDockerContainer()

    const startTime = Date.now()
    const appendTimes = []
    let eventsWritten = 0

    return Promise.race([
      new Promise((resolve) =>
        [...new Array(eventsToWrite)].map((_) => {
          const appendStart = Date.now()
          eventStoreDbClient
            .appendToStream(Math.random().toString(), [
              jsonEvent({
                type: 'Credited',
                data: { amount: Math.random(), currency: 'CAD' },
              }),
            ])
            .then(() => {
              appendTimes.push(Date.now() - appendStart)
              eventsWritten += 1

              if (eventsWritten >= eventsToWrite) {
                resolve()
              }
            })
        })
      ),
      new Promise((resolve) => setTimeout(resolve, maxDuration)),
    ]).then(() => {
      const report = prepareReport({
        appendTimes,
        startTime,
        eventsWritten,
      })
      console.log(report)
      require('fs').writeFileSync(
        require('path').join(__dirname, 'eventstoredb.txt'),
        report
      )
    })
  }).timeout(60000)
})
