const { sleep } = require('../auxiliary')
const { arrangeEventStore } = require('../../test/bootstrap')
const { assert } = require('chai')
const { ExpectedVersion } = require('../constants')

describe('appendToStream', () => {
  it('should append 3 events to an aggregate and have the correct expected version returned', async () => {
    const eventStore = await arrangeEventStore()

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
  })

  it('should protect concurrent access to a single stream by retrying inserts at a higher sequence number with no expected version specified', async () => {
    const eventStore = await arrangeEventStore()

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
  })

  it('should protect close to concurrent access to a single stream by retrying inserts at a higher sequence number with a expected version specified', async () => {
    const eventStore = await arrangeEventStore()

    const streamId = '123'
    const creditMoney = (amount) =>
      eventStore
        .readStreamForwards({ streamId: '123' })
        .then(({ expectedVersion }) =>
          eventStore.appendToStream({
            streamId,
            events: [
              {
                type: 'Credited',
                payload: {
                  amount,
                },
              },
            ],
            expectedVersion,
          })
        )

    await Promise.all([
      sleep(500).then(() => creditMoney(5)),
      sleep(1000).then(() => creditMoney(10)),
      sleep(1500).then(() => creditMoney(15)),
      sleep(2000).then(() => creditMoney(20)),
      sleep(2200).then(() => creditMoney(25)),
      sleep(2500).then(() =>
        eventStore
          .readStreamForwards({
            streamId,
          })
          .then(({ expectedVersion }) => assert.equal(expectedVersion, 4n))
      ),
    ])
  })
  it('should append 3 events to an aggregate and still have correct order when not specifying expected version', async () => {
    const eventStore = await arrangeEventStore()

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
    assert.equal(events[0].payload.amount, 5)
    assert.equal(events[1].payload.amount, 10)
    assert.equal(events[2].payload.amount, 15)
    assert.equal(events[3].payload.amount, 20)
  })
})
