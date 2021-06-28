const { prepareReport } = require('./core')
const { resetTables } = require('./pg-journal-harness')
const { eventStore, eventStoreClient } = require('./pg-journal-harness')
const { ExpectedVersion } = require('@pg-journal/event-store')
const { eventsToWrite, maxDuration } = require('./_config').testOptions

describe('benchmark pg-journal 10k writes', () => {
  it('should perform 10k writes as fast to 10k random streams as fast as possible', async () => {
    await resetTables()

    const startTime = Date.now()
    const appendTimes = []
    let eventsWritten = 0

    return Promise.race([
      new Promise((resolve) =>
        [...new Array(eventsToWrite)].map((_) => {
          const appendStart = Date.now()
          eventStore
            .appendToStream({
              aggregateId: Math.random().toString(),
              events: [
                {
                  type: 'Credited',
                  payload: { amount: Math.random(), currency: 'CAD' },
                },
              ],
              expectedVersion: ExpectedVersion.NoStream,
            })
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
        require('path').join(__dirname, 'pg-journal.txt'),
        report
      )
    })
  }).timeout(60000)
})
