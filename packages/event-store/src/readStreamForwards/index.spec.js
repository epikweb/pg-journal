const { assert } = require('chai')
const { cleanTables } = require('../../test/harness')
const { connectionString, schemaName } = require('../../test/config')
const { EventStore } = require('../event-store')

describe('readStreamForwards', () => {
  beforeEach(cleanTables)
  it('should return no events and sequence number readStreamForwards as zero if the aggregate does not yet exist', async () => {
    const eventStore = EventStore({ connectionString, schemaName })

    const output = await eventStore.readStreamForwards({
      aggregateId: 'wallet-123',
    })
    assert.deepEqual(output, {
      expectedVersion: 0,
      events: [],
    })
  }).timeout(15000)
})
