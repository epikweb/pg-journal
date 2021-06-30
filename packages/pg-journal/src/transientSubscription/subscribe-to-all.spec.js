const { arrangeEventStore } = require('../../test/bootstrap')
const { EventEmitter } = require('events')
const { assert } = require('chai')
const { log } = require('../logging')
const { StreamPosition } = require('../constants')
const { sleep } = require('../auxiliary')

describe('subscribe to all', () => {
  it('should receive some events when they are appended with a 1s delay', async () => {
    const eventStore = await arrangeEventStore()
    const streamId = '123'

    const appendEventWithDelay = (delay, eventData) =>
      new Promise(async (resolve) => {
        await sleep(delay)
        await eventStore.appendToStream({
          streamId,
          events: [eventData],
        })
        resolve()
      })

    await Promise.all([
      appendEventWithDelay(500, {
        type: 'Event1',
        payload: {
          hi: true,
        },
      }),
      appendEventWithDelay(1500, {
        type: 'Event2',
        payload: {
          hi: true,
        },
      }),
      new Promise((resolve) => {
        let eventsSeen = []

        const stream = eventStore.subscribeToAll({
          lastCheckpoint: StreamPosition.Start,
        })

        stream.on('eventsAppeared', ({ events, ack }) => {
          eventsSeen = [...eventsSeen, ...events]
          log.info(`Events seen`, eventsSeen)
          ack()

          try {
            assert.equal(eventsSeen.length, 2)
            assert.deepEqual(eventsSeen, [
              {
                streamId,
                type: 'Event1',
                payload: {
                  hi: true,
                },
                sequenceNumber: 0n,
              },
              {
                streamId,
                type: 'Event2',
                payload: {
                  hi: true,
                },
                sequenceNumber: 1n,
              },
            ])
            stream.stop()
            resolve()
          } catch (err) {
            log.error(`Not yet`, err)
          }
        })
      }),
    ])
  })

  it('should be aware of gaps in the global sequence and still deliver events in order', async () => {
    const eventStore = await arrangeEventStore()

    const append = ({ streamId, beginDelay, commitDelay, payload }) =>
      sleep(beginDelay).then(() =>
        eventStore.client.query(
          `
            INSERT INTO public.pg_journal_events (global_index, sequence_number, stream_id, event_type, event_payload) VALUES (default, 0, '${streamId}', 'Credited', '${JSON.stringify(
            payload
          )}');
          select pg_sleep(${Math.floor(commitDelay / 1000)})
          `
        )
      )

    return Promise.all([
      append({
        streamId: 'sora',
        beginDelay: 0,
        commitDelay: 5,
        payload: { amount: 5, currency: 'CAD' },
      }),
      append({
        streamId: 'kairi',
        beginDelay: 100,
        commitDelay: 250,
        payload: { amount: 5, currency: 'CAD' },
      }),
      append({
        streamId: 'riku',
        beginDelay: 200,
        commitDelay: 5,
        payload: { amount: 5, currency: 'CAD' },
      }),
      new Promise((resolve, reject) => {
        const plugin = new EventEmitter()
        let eventsSeen = []

        const stream = eventStore.subscribeToAll({
          lastCheckpoint: StreamPosition.Start,
          plugin,
        })

        stream.on('eventsAppeared', ({ events, ack }) => {
          eventsSeen = [...eventsSeen, ...events]
          log.info(`Events seen`, eventsSeen)
          ack()

          if (
            eventsSeen[0].streamId === 'sora' &&
            eventsSeen[1].streamId === 'riku'
          ) {
            return reject(new Error(`Received out of order`))
          }

          try {
            assert.deepEqual(eventsSeen, [
              {
                streamId: 'sora',
                type: 'Credited',
                payload: { amount: 5, currency: 'CAD' },
                sequenceNumber: 0n,
              },
              {
                streamId: 'kairi',
                type: 'Credited',
                payload: { amount: 5, currency: 'CAD' },
                sequenceNumber: 0n,
              },
              {
                streamId: 'riku',
                type: 'Credited',
                payload: { amount: 5, currency: 'CAD' },
                sequenceNumber: 0n,
              },
            ])
            stream.stop()
            resolve()
          } catch (err) {
            log.error(`Not yet`, err)
          }
        })
      }),
    ])
  })
})
