const { assert } = require('chai')
const { StreamPosition } = require('../constants')
const { cleanTables, constructEventStore } = require('../../test/harness')

describe('subscribe to stream', () => {
  beforeEach(cleanTables)

  it('should receive events from a single stream', async () => {
    const eventStore = constructEventStore()

    await Promise.all([
      eventStore.appendToStream({
        streamId: 'holo',
        events: [{ type: 'Test', payload: { hi: true } }],
      }),
      eventStore.appendToStream({
        streamId: 'lawrence',
        events: [{ type: 'Test', payload: { hi: true } }],
      }),
      new Promise((resolve) => {
        const stream = eventStore.subscribeToStream({
          streamId: 'lawrence',
          lastCheckpoint: StreamPosition.Start,
        })

        stream.on('eventsAppeared', ({ events, ack }) => {
          assert.deepEqual(events, [
            {
              streamId: 'lawrence',
              type: 'Test',
              payload: { hi: true },
              globalIndex: 2n,
            },
          ])
          resolve()
        })
      }),
    ])
  }).timeout(5000)
})
