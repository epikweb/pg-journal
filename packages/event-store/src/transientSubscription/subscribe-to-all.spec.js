const { EventEmitter } = require('events')
const { assert } = require('chai')
const { log } = require('../logging')
const { StreamPosition } = require('../constants')
const { ExpectedVersion } = require('../constants')
const { sleep } = require('../auxiliary')
const {
  cleanTables,
  constructEventStore,
  client,
} = require('../../test/harness')

describe('subscribe to all', () => {
  beforeEach(cleanTables)

  it('should receive some events when they are appended with a 1s delay', async () => {
    const eventStore = constructEventStore()

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
                globalIndex: 1n,
              },
              {
                streamId,
                type: 'Event2',
                payload: {
                  hi: true,
                },
                globalIndex: 2n,
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
  }).timeout(5000)

  it('should be aware of gaps in the global sequence and still deliver events in order', () => {
    const eventStore = constructEventStore()

    const append = ({ streamId, beginDelay, commitDelay, payload }) =>
      sleep(beginDelay).then(() =>
        client.query(
          `
            INSERT INTO public.pg_journal_events (global_index, sequence_number, stream_id, event_type, event_payload) VALUES (default, 0, '${streamId}', 'Credited', '${JSON.stringify(
            payload
          )}');
          select pg_sleep(${Math.floor(commitDelay / 1000)})
          `
        )
      )

    // timeline:
    // +0 ms -> sora assigned global_index = 1
    // +5 ms -> sora commits with global_index = 1
    // +100 ms -> kairi assigned global_index = 2
    // +200 ms -> riku assigned global_index = 3
    // +205 ms -> riku commits with global_index = 3
    // +300 ms -> projection polls
    // - sees global_index = 3
    // - realizes there is a gap
    // - we have a guarantee that the client holding the id in the gap will commit in 1s
    // - we track the last compliant id
    // - we advance only when its safe to do so
    // +1000ms -> kairi commits with global_index = 2
    // +1100ms -> projection polls
    // - sees kairi
    // - gives ids 2 + 3 to the plugin

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
                globalIndex: 1n,
              },
              {
                streamId: 'kairi',
                type: 'Credited',
                payload: { amount: 5, currency: 'CAD' },
                globalIndex: 2n,
              },
              {
                streamId: 'riku',
                type: 'Credited',
                payload: { amount: 5, currency: 'CAD' },
                globalIndex: 3n,
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
  }).timeout(3000)
})
