const { constructEventStore } = require('../../test/harness')
const { assert } = require('chai')
const { cleanTables } = require('../../test/harness')
const { ExpectedVersion } = require('../constants')
const { EventStore } = require('../event-store')

describe('appendToStream', () => {
  beforeEach(cleanTables)
  it('should appendToStream 3 events to an aggregate and have the correct expected version returned', async () => {
    const eventStore = constructEventStore()

    await eventStore.appendToStream({
      aggregateId: 'wallet-123',
      events: [
        { type: 'Credited', payload: { amount: 5 } },
        { type: 'Debited', payload: { amount: 5 } },
        { type: 'Credited', payload: { amount: 5 } },
      ],
      expectedVersion: ExpectedVersion.NoStream,
    })

    const { expectedVersion } = await eventStore.readStreamForwards({
      aggregateId: 'wallet-123',
    })
    assert.equal(expectedVersion, 2)
  }).timeout(15000)

  it('should protect concurrent access to a single stream by retrying inserts at a higher sequence number', async () => {
    const eventStore = constructEventStore()

    await Promise.all(
      [...new Array(5)].map((_) =>
        eventStore.appendToStream({
          aggregateId: '123',
          events: [
            {
              type: 'Event',
              payload: {
                test: true,
              },
            },
          ],
          expectedVersion: 0,
        })
      )
    )

    const { expectedVersion } = await eventStore.readStreamForwards({
      aggregateId: '123',
    })
    assert.equal(expectedVersion, 4)
  }).timeout(15000)
  it('shouldnt retry appending events infinitely to an aggregate (hot aggregates are a known anti-pattern)', async () => {})
})
