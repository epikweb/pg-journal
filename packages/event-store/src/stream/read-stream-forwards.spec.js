const { assert } = require('chai')
const { arrangeEventStore } = require('../../test/bootstrap')

describe('readStreamForwards', () => {
  it('should return no events and sequence number readStreamForwards as zero if the aggregate does not yet exist', async () => {
    const eventStore = await arrangeEventStore()

    const output = await eventStore.readStreamForwards({
      streamId: 'wallet-123',
    })
    assert.deepEqual(output, {
      expectedVersion: 0n,
      events: [],
    })
  })
})
