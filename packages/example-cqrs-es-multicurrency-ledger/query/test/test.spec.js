/* eslint-disable */

const { sleep } = require('../src/core')
const { mutateLedgers } = require('../src/core')
const { calculateLedgerBalances } = require('../src/core')
const {
  PostgresProjectionPlugin,
} = require('../../../projector-postgres/src/store')
const { EventStore } = require('../../../event-store/src/event-store')
const { getLedgers } = require('../src/core')
const { assert } = require('chai')
const { ExpectedVersion } = require('../../../projector-postgres/src/constants')

describe('postgres projection plugin', () => {
  beforeEach(() =>
    Promise.all([
      eventStoreTestHarness.resetTables(),
      postgresProjectionPluginTestHarness.resetTables(),
    ])
  )

  it('should project events into postgres relational tables', async () => {
    const checkIfStateHasConverged = () =>
      getLedgers().then((ledgers) =>
        assert.deepEqual(ledgers, [
          { currency: 'USD', balance: -555.0 },
          { currency: 'THB', balance: 4312 },
          { currency: 'EUR', balance: 929 },
        ])
      )

    const eventStore = EventStore({
      connectionString: eventStoreTestHarness.connectionString,
    })
    const postgresProjectionPlugin = PostgresProjectionPlugin({
      eventStore,
      connectionString: postgresProjectionPluginTestHarness.connectionString,
    })

    const projector = require('events').EventEmitter()
    projector.on('eventsReceived', (events) =>
      getLedgers()
        .then((ledgers) => calculateLedgerBalances(ledgers)(events))
        .then((ledgers) => mutateLedgers(ledgers))
        .then(() => projector.emit('eventsProcessed'))
        .then(() => checkIfStateHasConverged().catch(console.error))
    )

    return Promise.all([
      postgresProjectionPlugin.beginProjection({ name: 'test', projector }),
      eventStore.appendToStream({
        aggregateId: 'wallet-123',
        events: [
          { type: 'Credited', payload: { amount: 123, currency: 'EUR' } },
        ],
        expectedVersion: ExpectedVersion.NoStream,
      }),
      new Promise(async (resolve) => {
        await sleep(1000)
        await eventStore.appendToStream({
          aggregateId: 'wallet-999',
          events: [
            { type: 'Credited', payload: { amount: 929, currency: 'EUR' } },
            { type: 'Credited', payload: { amount: 4312, currency: 'THB' } },
            { type: 'Debited', payload: { amount: 555, currency: 'USD' } },
          ],
          expectedVersion: ExpectedVersion.NoStream,
        })
        resolve()
      }),
    ])
  }).timeout(60000)
})
