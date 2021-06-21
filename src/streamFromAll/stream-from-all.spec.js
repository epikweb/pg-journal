const { assert } = require('chai')
const { StreamPosition } = require('../constants')
const { EventStore } = require('..')
const { ProjectionStore } = require('..')
const {
  arrangeDatabase,
  connectionString,
  pool,
} = require('../../test/_harness')

describe('streamFromAll', () => {
  it('should get events as they are appended to different streams', async () => {
    await arrangeDatabase()
    const eventStore = EventStore({ connectionString })
    const projectionStore = ProjectionStore({
      eventStoreConnection: { connectionString },
      projectionStoreConnection: { connectionString },
    })

    const flags = {
      test1: false,
      test2: false,
    }
    return new Promise(async (resolve) => {
      projectionStore
        .streamFromAll({
          subscriptionName: 'test',
          projectEvents: ({ events }) => {
            console.log(events)
            try {
              assert.deepEqual(events, [
                {
                  aggregateId: '123',
                  type: 'Credited',
                  payload: { amount: 5 },
                  globalIndex: '1',
                },
              ])

              flags.test1 = true
              // eslint-disable-next-line no-empty
            } catch (err) {}

            try {
              assert.deepEqual(events, [
                {
                  aggregateId: '456',
                  type: 'Credited',
                  payload: { amount: 5 },
                  globalIndex: '2',
                },
                {
                  aggregateId: '456',
                  type: 'Debited',
                  payload: { amount: 4 },
                  globalIndex: '3',
                },
              ])
              flags.test2 = true
              // eslint-disable-next-line no-empty
            } catch (err) {}

            if (flags.test1 && flags.test2) {
              resolve()
            }
          },
        })
        .catch((err) => console.error(err))

      await eventStore.appendToStream({
        aggregateId: '123',
        events: [
          {
            type: 'Credited',
            payload: {
              amount: 5,
            },
          },
        ],
        expectedVersion: StreamPosition.Start,
      })

      setTimeout(async () => {
        await eventStore.appendToStream({
          aggregateId: '456',
          events: [
            {
              type: 'Credited',
              payload: {
                amount: 5,
              },
            },
            {
              type: 'Debited',
              payload: {
                amount: 4,
              },
            },
          ],
          expectedVersion: 0,
        })
      }, 1000)
    })
  }).timeout(15000)
  it('should be aware of gaps in the global order when polling', async () => {
    await cleanDatabase()
    const eventStore = EventStore({ connectionString })

    return new Promise(async (resolve) => {
      eventStore.streamFromAll({
        lastCheckpoint: 0,
        onCheckpointReached: async ({ checkpoint, events }) => {
          const client = await pool.connect()

          await client.query('begin transaction;')
          const { rows } = await client.query('select * from global_ledgers')

          console.log('EVENTS', events)
          const state = events.reduce(
            (state, event) => {
              const match = state.find(
                ({ currency }) => currency === event.payload.currency
              )

              console.log('Got')
              return match
                ? {
                    ...state,
                    [match.currency]: match.balance + event.payload.amount,
                  }
                : { ...state, [event.payload.currency]: event.payload.amount }
            },
            rows.map((row) => ({
              currency: row.currency,
              balance: row.balance,
            }))
          )
          console.log('STATE IS', state)

          for (const { currency, balance } of state) {
            const exists = rows.find((row) => row.currency === currency)

            if (exists) {
              await client.query(
                'update global_ledgers set balance = $1 where currency = $2',
                [balance, currency]
              )
            } else {
              await client.query(
                'insert into global_ledgers(currency, balance) values($1, $2)',
                [currency, balance]
              )
            }
          }

          /* await pool.query(`update projections set checkpoint = $1 where name = $2`, [
              checkpoint,
              'global_ledgers'
            ]) */
          await client.query('commit;')
        },
        pollInterval: 100,
      })

      setInterval(async () => {
        await eventStore.appendToStream({
          aggregateId: require('uuid').v4(),
          events: [
            {
              type: 'Credited',
              payload: {
                amount: 5,
                currency: 'CAD',
              },
            },
            {
              type: 'Credited',
              payload: {
                amount: 4,
                currency: 'CAD',
              },
            },
          ],
          expectedVersion: 0,
        })
      }, 100)
    })
  }).timeout(200000)
})
