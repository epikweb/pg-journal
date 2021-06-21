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
  const appendEvents = (eventStore, number) => {
    for (let i = 0; i < number; i += 1) {
      eventStore.appendToStream({
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

  it('should receive one event', async () => {
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
  it('should receive two events', async () => {
    await arrangeDatabase()

    const eventStore = EventStore({ connectionString })
    await appendEvents(eventStore, 3)

    const output = await sut(2)
    console.log(output)
    assert.equal(output.events.length, 2)
    assert.equal(output.nextCheckpoint, 2)
  })
})
