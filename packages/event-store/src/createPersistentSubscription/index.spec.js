const { constructEventStore } = require('../../test/harness')
const { cleanTables } = require('../../test/harness')

describe('createPersistentSubscription', () => {
  beforeEach(cleanTables)

  describe('one consumer group', () => {
    it('should create a new persistent subscription and receive some events', async () => {
      const eventStore = constructEventStore()
    }).timeout(15000)
  })
})
