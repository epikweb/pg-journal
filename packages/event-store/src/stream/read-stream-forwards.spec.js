const { assert } = require('chai')
const { cleanTables, constructEventStore } = require('../../test/harness')

describe('readStreamForwards', () => {
  beforeEach(cleanTables)
  it('should return no events and sequence number readStreamForwards as zero if the aggregate does not yet exist', async () => {
    const eventStore = constructEventStore()

    const output = await eventStore.readStreamForwards({
      streamId: 'wallet-123',
    })
    assert.deepEqual(output, {
      expectedVersion: 0,
      events: [],
    })
  }).timeout(15000)
})
