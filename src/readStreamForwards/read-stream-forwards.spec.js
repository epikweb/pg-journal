const { assert } = require('chai')
const { arrangeDatabase } = require('../../test/_harness')
const { EventStore } = require('..')
const { connectionString } = require('../../test/_harness')

describe('readStreamForwards', () => {
  it('should return no events and sequence number readStreamForwards as zero if the aggregate does not yet exist', async () => {
    await arrangeDatabase()
    const eventStore = EventStore({ connectionString })

    const output = await eventStore.readStreamForwards({
      aggregateId: 'wallet-123',
    })
    assert.deepEqual(output, {
      expectedVersion: 0,
      events: [],
    })
  }).timeout(15000)
})
