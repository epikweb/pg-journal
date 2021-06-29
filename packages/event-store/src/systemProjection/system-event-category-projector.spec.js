const { StreamPosition } = require('../constants')
const { constructEventStore } = require('../../test/harness')
const { cleanTables } = require('../../test/harness')
const { assert } = require('chai')

describe('event category projector', () => {
  beforeEach(cleanTables)
  it('should categorize each event by the word before the - of the stream id and receive events out of order', async () => {
    const eventStore = constructEventStore({
      enabledSystemProjections: ['event-category'],
    })

    const streamIds = ['trader-123', 'trader-456', 'banker-789']

    for (const streamId of streamIds) {
      await eventStore.appendToStream({
        streamId,
        events: [
          { type: 'Credited', payload: { amount: 1 } },
          { type: 'Debited', payload: { amount: 2 } },
          { type: 'Credited', payload: { amount: 3 } },
        ],
      })
    }

    return new Promise((resolve) => {
      const stream = eventStore.subscribeToStream({
        streamId: '$category-trader',
        lastCheckpoint: StreamPosition.Start,
      })

      stream.on('eventsAppeared', ({ events }) => {
        assert.includeDeepMembers(events, [
          {
            streamId: '$category-trader',
            type: 'Credited',
            payload: { amount: 1 },
          },
          {
            streamId: '$category-trader',
            type: 'Debited',
            payload: { amount: 2 },
          },
          {
            streamId: '$category-trader',
            type: 'Credited',
            payload: { amount: 3 },
          },
          {
            streamId: '$category-trader',
            type: 'Credited',
            payload: { amount: 1 },
          },
          {
            streamId: '$category-trader',
            type: 'Debited',
            payload: { amount: 2 },
          },
          {
            streamId: '$category-trader',
            type: 'Credited',
            payload: { amount: 3 },
          },
        ])
        stream.stop()
        resolve()
      })
    })
  }).timeout(15000)
})
