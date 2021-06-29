const { pipe } = require('./core')
const { sleep } = require('./core')
const { saveReadBenchmark } = require('./harness')
const { StreamPosition } = require('@pg-journal/event-store')
const { ExpectedVersion } = require('@pg-journal/event-store')
const { benchmarkWrites } = require('./harness')
const { bootstrapEventStoreDb } = require('./bootstrap-eventstoredb')
const { bootstrapPgJournal } = require('./bootstrap-pg-journal')
const {
  jsonEvent,
  START,
  ROUND_ROBIN,
  persistentSubscriptionSettingsFromDefaults,
} = require('@eventstore/db-client')

const benchmarkName = require('path')
  .basename(__filename)
  .replace('.spec.js', '')

const eventsToWrite = 5000
const timeoutMs = 5000
const writeOptions = { eventsToWrite, concurrent: false, timeoutMs }
const consumerGroups = [
  { groupName: 'alpha', nodes: 1 },
  { groupName: 'beta', nodes: 2 },
  { groupName: 'charlie', nodes: 3 },
]
const streamName = 'holo'

describe('a benchmark', () => {
  it.skip('should benchmark pgjournal', async () => {
    const config = {
      image: 'library/postgres:10.12',
      poolSize: 4,
    }
    const pgJournal = await bootstrapPgJournal(config)

    console.log(`Starting benchmark for pg-journal`)

    let writeAckDelay
    await benchmarkWrites(
      () =>
        pgJournal.appendToStream({
          aggregateId: Math.random().toString(),
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

    // TODO

    await pgJournal.close()
  }).timeout(120000)
  it('should benchmark eventstoredb', async () => {
    const config = {
      image: 'eventstore/eventstore:21.2.0-buster-slim',
      dockerFlags: [
        '-e',
        'EVENTSTORE_CLUSTER_SIZE=1',
        '-e',
        'EVENTSTORE_RUN_PROJECTIONS=none',
        '-e',
        'EVENTSTORE_START_STANDARD_PROJECTIONS=benchmarks',
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

    console.log(`Writing ${eventsToWrite} test events`)
    await benchmarkWrites(
      () =>
        eventStoreDb.appendToStream(streamName, [
          jsonEvent({
            type: 'Credited',
            data: { amount: Math.random(), currency: 'CAD' },
          }),
        ]),
      writeOptions
    )

    console.log(`Events written, setting up 3 consumer groups`, consumerGroups)
    await Promise.all(
      consumerGroups.map(({ groupName }) =>
        new Promise((resolve) => {
          console.log(
            `Setting up consumer group`,
            streamName,
            groupName,
            persistentSubscriptionSettingsFromDefaults({
              fromRevision: START,
            })
          )
          resolve()
        }).then(() =>
          eventStoreDb
            .createPersistentSubscription(
              streamName,
              groupName,
              persistentSubscriptionSettingsFromDefaults({
                fromRevision: START,
              })
            )
            .then((res) =>
              console.log(`Consumer group created:`, groupName, res)
            )
            .catch(console.error)
        )
      )
    )

    const startTime = Date.now()

    await Promise.all(
      consumerGroups.map(
        ({ groupName, nodes }) =>
          new Promise((resolve) => {
            const uniqueEventIdsRead = []
            const nodeSubscriptions = []

            ;[...new Array(nodes)].forEach((_, index) =>
              pipe(
                () => index + 1,
                (nodeId) => {
                  const subscription =
                    eventStoreDb.connectToPersistentSubscription(
                      streamName,
                      groupName
                    )

                  nodeSubscriptions.push(subscription)
                  console.log(
                    `Consumer connected to group ${groupName} on node id ${nodeId}`
                  )
                  subscription.on('data', async (event) => {
                    if (uniqueEventIdsRead.includes(event.event.id)) {
                      console.log(
                        `Consumer group ${groupName} received duplicate event ${event.event.id} on node id ${nodeId}, skipping...`
                      )
                    } else {
                      uniqueEventIdsRead.push(event.event.id)
                      console.log(
                        `Consumer group ${groupName} received new event ${event.event.id} on node id ${nodeId}, acknowledging...`
                      )

                      await subscription.ack(event.event.id)
                      console.log(
                        `Total unique events read: ${uniqueEventIdsRead.length}`
                      )

                      if (uniqueEventIdsRead.length === eventsToWrite) {
                        console.log(`Consumer group ${groupName} is caught up!`)
                        resolve()
                      }
                    }
                  })
                }
              )()
            )
          })
      )
    )

    await saveReadBenchmark({
      eventsRead: eventsToWrite * consumerGroups.length,
      startTime,
      image: config.image,
      benchmarkName,
      metadata: {
        flags: config.dockerFlags.filter((val) => val !== '-e'),
        consumerGroups,
      },
    })

    // await eventStoreDb.close()
  }).timeout(120000)
})
