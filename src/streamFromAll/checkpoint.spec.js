const { assert } = require('chai')
const { ExpectedVersion } = require('../constants')
const { EventStore } = require('../index')
const { StreamPosition } = require('../constants')
const sut = require('./checkpoint').takeNextEventBatch
const {
  arrangeDatabase,
  connectionString,
  pool,
} = require('../../test/_harness')

describe('checkpointing', () => {
  const appendEvents = async (eventStore, number) => {
    for (let i = 0; i < number; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await eventStore.appendToStream({
        aggregateId: '123',
        events: [
          {
            type: 'Event',
            payload: {
              hi: true,
            },
          },
        ],
        expectedVersion: ExpectedVersion.NoStream + i,
      })
    }
  }

  it('should receive one event when one is persisted and a batch size of one is requested', async () => {
    await arrangeDatabase()

    const eventStore = EventStore({ connectionString })
    await appendEvents(eventStore, 1)

    const output = await sut({
      eventStorePool: pool,
      projectionStorePool: pool,
      subscriptionName: 'test',
      checkpoint: StreamPosition.Start,
      batchSize: 1,
    })

    assert.equal(output.events.length, 1)
    assert.equal(output.nextCheckpoint, 1)
  })
  it('should receive two events when three are persisted and a batch size of two is requested', async () => {
    await arrangeDatabase()

    const eventStore = EventStore({ connectionString })
    await appendEvents(eventStore, 3)

    const output = await sut({
      eventStorePool: pool,
      projectionStorePool: pool,
      subscriptionName: 'test',
      checkpoint: StreamPosition.Start,
      batchSize: 2,
    })

    assert.equal(output.events.length, 2)
    assert.equal(output.nextCheckpoint, 2)
  })
  it('should receive three events when three are persisted and a batch size of four is requested', async () => {
    await arrangeDatabase()

    const eventStore = EventStore({ connectionString })
    await appendEvents(eventStore, 3)

    const output = await sut({
      eventStorePool: pool,
      projectionStorePool: pool,
      subscriptionName: 'test',
      checkpoint: StreamPosition.Start,
      batchSize: 4,
    })

    assert.equal(output.events.length, 3)
    assert.equal(output.nextCheckpoint, 3)
  })
  it('should receive two events twice when four are persisted and a batch size of two is requested', async () => {
    await arrangeDatabase()

    const eventStore = EventStore({ connectionString })
    await appendEvents(eventStore, 4)

    const output1 = await sut({
      eventStorePool: pool,
      projectionStorePool: pool,
      subscriptionName: 'test',
      checkpoint: StreamPosition.Start,
      batchSize: 2,
    })
    assert.equal(output1.events.length, 2)
    assert.equal(output1.nextCheckpoint, 2)

    const output2 = await sut({
      eventStorePool: pool,
      projectionStorePool: pool,
      subscriptionName: 'test',
      checkpoint: output1.nextCheckpoint,
      batchSize: 2,
    })
    assert.equal(output2.events.length, 2)
    assert.equal(output2.nextCheckpoint, 4)
  })
})
