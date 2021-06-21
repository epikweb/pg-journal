const { assert } = require('chai')
const { StreamPosition, ExpectedVersion } = require('../constants')
const { arrangeDatabase } = require('../../test/_harness')
const { connectionString } = require('../../test/_harness')
const { EventStore } = require('..')

describe('appendToStream', () => {
  it('should appendToStream 3 events to an aggregate + snapshot it', async () => {
    await arrangeDatabase()
    const eventStore = EventStore({ connectionString })

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
    assert.equal(expectedVersion, 3)
  }).timeout(15000)

  it('should protect concurrent access to a single stream by retrying to insert at a higher sequence number', async () => {
    await arrangeDatabase()
    const eventStore = EventStore({ connectionString })

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

    const { expectedVersion, events } = await eventStore.readStreamForwards({
      aggregateId: '123',
    })
    assert.equal(expectedVersion, 5)
  }).timeout(15000)
})
