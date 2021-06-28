/* eslint-disable */

const { ExpectedVersion } = require('packages/event-store')
const { resetTables } = require('../example-multicurrency-ledger/test/harness')

describe('postgres event store benchmarks', () => {
  beforeEach(resetTables)

  it('should append 100k events to 100k different aggregates in 10 seconds', async () => {
    const totalEventsPerSecond = 5000
    const testDurationSeconds = 10
    const appendTimes = []

    const start = Date.now()
    await new Promise((resolve) => {
      ;[...new Array(testDurationSeconds * totalEventsPerSecond)].map((_) => {
        const delay = Math.random() * testDurationSeconds * 1000

        setTimeout(() => {
          const start2 = Date.now()
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
            .then(() => appendTimes.push(Date.now() - start2))
        }, delay)
      })

      setTimeout(() => {
        eventStoreClient
          .query(
            `select count(*) as count from event_store.public.pg_journal_events`
          )
          .then((rows) => {
            const elapsed = Math.floor((Date.now() - start) / 1000)

            console.log(`
             ${parseFloat(rows[0].count / elapsed).toFixed(8)} writes/sec
             ${
               appendTimes.reduce((total, r) => r + total, 0) /
               appendTimes.length
             } average append latency
            `)
            resolve()
          })
      }, testDurationSeconds * 1000)
    })
  }).timeout(60000)

  /*
  it.skip('should append 100k events in 10 seconds', async () => {
    outstandingBalancesProjection.start({
      pollInterval: 1000,
      batchSize: 50000,
    })

    const totalEventsPerSecond = 5000
    const testDurationSeconds = 10

    const start = Date.now()
    await new Promise((resolve) => {
      ;[...new Array(testDurationSeconds * totalEventsPerSecond)].map((_) => {
        const delay = Math.random() * testDurationSeconds * 1000
        console.log(delay)

        setTimeout(() => {
          const start2 = Date.now()
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
            .then(() => console.log(`Append took ${Date.now() - start2}ms`))
        }, delay)
      })

      setTimeout(() => {
        console.log('Running')
        const seconds = Math.floor((Date.now() - start) / 1000)
        Promise.all([
          eventStoreClient
            .query(
              `select count(*) as count from event_store.public.pg_journal_events`
            )
            .then(
              (rows) =>
                `${parseFloat(rows[0].count / seconds).toFixed(8)} writes/sec`
            ),
          postgresProjectorClient
            .query(`select checkpoint from pg_journal_projection_state`)
            .then(
              (rows) =>
                `${parseFloat(rows[0].checkpoint / seconds).toFixed(
                  8
                )} replays/sec`
            ),
        ])
          .then(console.log)
          .then(resolve)
      }, testDurationSeconds * 1000)
    })
  }).timeout(60000)*/
})
