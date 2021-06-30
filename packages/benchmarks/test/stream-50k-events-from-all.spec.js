const { sleep } = require('../src/core')
const { saveReadBenchmark } = require('../src/harness')
const { StreamPosition } = require('fact-pg-journal')
const { ExpectedVersion } = require('fact-pg-journal')
const { benchmarkWrites } = require('../src/harness')
const { bootstrapEventStoreDb } = require('../src/bootstrap-eventstoredb')
const { bootstrapPgJournal } = require('fact-pg-journal/test/bootstrap')
const { jsonEvent, START } = require('@eventstore/db-client')

const benchmarkName = require('path')
  .basename(__filename)
  .replace('.spec.js', '')

const eventsToWrite = 50000
const timeoutMs = 30000
const writeOptions = { eventsToWrite, concurrent: false, timeoutMs }

describe('a benchmark', () => {
  it('should benchmark pgjournal', async () => {
    const config = {
      image: 'library/postgres:10.12',
      poolSize: 4,
    }
    const pgJournal = await bootstrapPgJournal(config)

    console.log(`Starting benchmark for fact-pg-journal`)

    let writeAckDelay
    await benchmarkWrites(
      () =>
        pgJournal.appendToStream({
          streamId: Math.random().toString(),
          events: [
            {
              type: 'Credited',
              payload: { amount: Math.random(), currency: 'CAD' },
            },
          ],
          expectedVersion: ExpectedVersion.NoStream,
        }),
      writeOptions
    ).then(() => {
      const writeAckStart = Date.now()
      return new Promise((resolve) =>
        (function retry() {
          pgJournal.client
            .single(`select count(*) from pg_journal_events`)
            .then(({ count }) => {
              console.log('Acked writes', count)

              if (parseInt(count, 10) === eventsToWrite) {
                writeAckDelay = Date.now() - writeAckStart
                return resolve()
              }

              return sleep(500).then(retry)
            })
        })()
      )
    })
    console.log(`Events written, beginning stream from all`)

    const stream = await pgJournal.streamFromAll({
      lastCheckpoint: StreamPosition.Start,

      // 10k seems to be fair based on https://developers.eventstore.com/clients/dotnet/5.0/subscriptions/catchup-subscriptions.html#subscribing-to-a-stream
      batchSize: 10000,
    })
    const startTime = Date.now()
    let eventsRead = 0
    await new Promise((resolve) =>
      stream.on('eventsAppeared', ({ ack, events }) => {
        eventsRead += events.length
        console.log(eventsRead)
        ack()
        if (eventsRead >= eventsToWrite) {
          stream.stop()
          resolve()
        }
      })
    )

    await saveReadBenchmark({
      eventsRead,
      startTime,
      image: config.image,
      benchmarkName,
      metadata: {
        poolSize: config.poolSize,
        writeAckDelay,
      },
    })

    await pgJournal.close()
  })
  it('should benchmark eventstoredb', async () => {
    const config = {
      image: 'eventstore/eventstore:21.2.0-buster-slim',
      dockerFlags: [
        '-e',
        'EVENTSTORE_CLUSTER_SIZE=1',
        '-e',
        'EVENTSTORE_RUN_PROJECTIONS=all',
        '-e',
        'EVENTSTORE_START_STANDARD_PROJECTIONS=true',
        '-e',
        'EVENTSTORE_EXT_TCP_PORT=1113',
        '-e',
        'EVENTSTORE_EXT_HTTP_PORT=2113',
        '-e',
        'EVENTSTORE_INSECURE=1',
        '-e',
        'EVENTSTORE_ENABLE_EXTERNAL_TCP=true',
        '-e',
        'EVENTSTORE_ENABLE_ATOM_PUB_OVER_HTTP=true',
      ],
    }
    const eventStoreDb = await bootstrapEventStoreDb(config)

    console.log(`Starting benchmark for eventstoredb`)
    await benchmarkWrites(
      () =>
        eventStoreDb.appendToStream(Math.random().toString(), [
          jsonEvent({
            type: 'Credited',
            data: { amount: Math.random(), currency: 'CAD' },
          }),
        ]),
      writeOptions
    )

    console.log(`Events written, beginning stream from all`)

    const stream = await eventStoreDb.subscribeToAll({
      fromPosition: START,
    })
    const startTime = Date.now()
    let eventsRead = 0

    // event store expects us to enqueue events and pop them off as processed, where as we have an ack for each batch (similar to persistence subscriptions)
    // https://groups.google.com/g/event-store/c/yThw2x614UE
    await new Promise((resolve) =>
      stream.on('data', (event) => {
        eventsRead += 1
        if (eventsRead >= eventsToWrite) {
          stream.unsubscribe()
          resolve()
        }
      })
    )

    await saveReadBenchmark({
      eventsRead,
      startTime,
      image: config.image,
      benchmarkName,
      metadata: {
        flags: config.dockerFlags.filter((val) => val !== '-e'),
      },
    })

    await eventStoreDb.close()
  })
})
