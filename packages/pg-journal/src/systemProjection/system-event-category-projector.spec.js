const { sleep } = require('../auxiliary')
const { arrangeEventStore } = require('../../test/bootstrap')
const { StreamPosition } = require('../constants')
const { assert } = require('chai')

describe('event category projector', () => {
  it('should categorize each event by the word before the - of the stream id and receive events in order', async () => {
    const eventStore = await arrangeEventStore({
      enabledSystemProjections: ['event-category'],
    })

    return Promise.all([
      sleep(500).then(() =>
        eventStore.appendToStream({
          streamId: 'trader-123',
          events: [{ type: 'Credited', payload: { amount: 1 } }],
        })
      ),
      sleep(1000).then(() =>
        eventStore.appendToStream({
          streamId: 'trader-123',
          events: [{ type: 'Credited', payload: { amount: 2 } }],
        })
      ),
      sleep(1250).then(() =>
        eventStore.appendToStream({
          streamId: 'banker-123',
          events: [
            { type: 'AccountOpened', payload: { beneficiaryName: 'Steve' } },
          ],
        })
      ),
      sleep(1500).then(() =>
        eventStore.appendToStream({
          streamId: 'trader-789',
          events: [{ type: 'Credited', payload: { amount: 3 } }],
        })
      ),
      new Promise((resolve) => {
        const stream = eventStore.subscribeToSystemStream({
          streamId: 'event-category-trader',
          lastCheckpoint: StreamPosition.Start,
        })

        let eventsSeen = []
        stream.on('eventsAppeared', ({ events, ack }) => {
          eventsSeen = [...eventsSeen, ...events]

          console.log('Events seen', eventsSeen)
          try {
            assert.deepEqual(eventsSeen, [
              {
                streamId: 'event-category-trader',
                type: 'Credited',
                payload: { amount: 1 },
                sequenceNumber: 0n,
              },
              {
                streamId: 'event-category-trader',
                type: 'Credited',
                payload: { amount: 2 },
                sequenceNumber: 1n,
              },
              {
                streamId: 'event-category-trader',
                type: 'Credited',
                payload: { amount: 3 },
                sequenceNumber: 2n,
              },
            ])
            stream.stop()
            resolve()
          } catch (err) {
            console.error(`Not yet`, err)
            ack()
          }
        })
      }),
    ])
  })
})
