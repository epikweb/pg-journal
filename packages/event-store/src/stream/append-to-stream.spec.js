const { constructEventStore } = require('../../test/harness')
const { assert } = require('chai')
const { cleanTables } = require('../../test/harness')
const { ExpectedVersion } = require('../constants')
const { EventStore } = require('../event-store')

describe('appendToStream', () => {
  beforeEach(cleanTables)
  it('should append 3 events to an aggregate and have the correct expected version returned', async () => {
    const eventStore = constructEventStore()

    await eventStore.appendToStream({
      streamId: 'wallet-123',
      events: [
        { type: 'Credited', payload: { amount: 5 } },
        { type: 'Debited', payload: { amount: 5 } },
        { type: 'Credited', payload: { amount: 5 } },
      ],
      expectedVersion: ExpectedVersion.NoStream,
    })

    const { expectedVersion } = await eventStore.readStreamForwards({
      streamId: 'wallet-123',
    })
    assert.equal(expectedVersion, 2)
  }).timeout(15000)

  it('should protect concurrent access to a single stream by retrying inserts at a higher sequence number', async () => {
    const eventStore = constructEventStore()

    await Promise.all(
      [...new Array(5)].map((_) =>
        eventStore.appendToStream({
          streamId: '123',
          events: [
            {
              type: 'Event',
              payload: {
                test: true,
              },
            },
          ],
        })
      )
    )

    const { expectedVersion } = await eventStore.readStreamForwards({
      streamId: '123',
    })
    assert.equal(expectedVersion, 4n)
  }).timeout(15000)

  it('should append 3 events to an aggregate and still have correct order when not specifying expected version', async () => {
    const eventStore = constructEventStore()

    await eventStore.appendToStream({
      streamId: 'wallet-123',
      events: [{ type: 'Credited', payload: { amount: 5 } }],
    })

    await eventStore.appendToStream({
      streamId: 'wallet-123',
      events: [
        { type: 'Credited', payload: { amount: 10 } },
        { type: 'Debited', payload: { amount: 15 } },
        { type: 'Credited', payload: { amount: 20 } },
      ],
    })

    const { events } = await eventStore.readStreamForwards({
      streamId: 'wallet-123',
    })
  }).timeout(15000)
})
