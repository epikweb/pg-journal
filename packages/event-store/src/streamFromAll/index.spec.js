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

describe('stream from all', () => {
  beforeEach(cleanTables)

  it('should receive events from a single aggregate', async () => {
    const eventStore = constructEventStore()

    const aggregateId = '123'

    const appendEventWithDelay = (delay, expectedVersion, eventData) =>
      new Promise(async (resolve) => {
        await sleep(delay)
        await eventStore.appendToStream({
          aggregateId,
          events: [eventData],
          expectedVersion,
        })
        resolve()
      })

    await Promise.all([
      appendEventWithDelay(500, ExpectedVersion.NoStream, {
        type: 'Event1',
        payload: {
          hi: true,
        },
      }),
      appendEventWithDelay(1500, 1, {
        type: 'Event2',
        payload: {
          hi: true,
        },
      }),
      new Promise((resolve) => {
        let eventsSeen = []

        const stream = eventStore.streamFromAll({
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
                aggregateId,
                type: 'Event1',
                payload: {
                  hi: true,
                },
              },
              {
                aggregateId,
                type: 'Event2',
                payload: {
                  hi: true,
                },
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

    const append = ({ aggregateId, beginDelay, commitDelay, payload }) =>
      sleep(beginDelay).then(() =>
        client.query(
          `
            INSERT INTO public.pg_journal_events (global_index, sequence_number, aggregate_id, event_type, event_payload, tags, timestamp) VALUES (default, 0, '${aggregateId}', 'Credited', '${JSON.stringify(
            payload
          )}', null, default);
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
        aggregateId: 'sora',
        beginDelay: 0,
        commitDelay: 5,
        payload: { amount: 5, currency: 'CAD' },
      }),
      append({
        aggregateId: 'kairi',
        beginDelay: 100,
        commitDelay: 250,
        payload: { amount: 5, currency: 'CAD' },
      }),
      append({
        aggregateId: 'riku',
        beginDelay: 200,
        commitDelay: 5,
        payload: { amount: 5, currency: 'CAD' },
      }),
      new Promise((resolve, reject) => {
        const plugin = new EventEmitter()
        let eventsSeen = []

        const stream = eventStore.streamFromAll({
          lastCheckpoint: StreamPosition.Start,
          plugin,
        })

        stream.on('eventsAppeared', ({ events, ack }) => {
          eventsSeen = [...eventsSeen, ...events]
          log.info(`Events seen`, eventsSeen)
          ack()

          if (
            eventsSeen[0].aggregateId === 'sora' &&
            eventsSeen[1].aggregateId === 'riku'
          ) {
            return reject(new Error(`Received out of order`))
          }

          try {
            assert.deepEqual(eventsSeen, [
              {
                aggregateId: 'sora',
                type: 'Credited',
                payload: { amount: 5, currency: 'CAD' },
              },
              {
                aggregateId: 'kairi',
                type: 'Credited',
                payload: { amount: 5, currency: 'CAD' },
              },
              {
                aggregateId: 'riku',
                type: 'Credited',
                payload: { amount: 5, currency: 'CAD' },
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
