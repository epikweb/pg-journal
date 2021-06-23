const { EventEmitter } = require('events')
const { assert } = require('chai')
const { StreamPosition } = require('../constants')
const { ExpectedVersion } = require('../constants')
const { sleep } = require('../auxiliary')
const { EventStore } = require('../event-store')
const { cleanTables } = require('../../test/harness')
const { schemaName, connectionString } = require('../../test/config')

describe('stream from all', () => {
  beforeEach(cleanTables)

  it('should receive events', async () => {
    const eventStore = EventStore({ schemaName, connectionString })
    const plugin = new EventEmitter()

    const aggregateId = '123'
    const firstEvent = {
      type: 'Event1',
      payload: {
        hi: true,
      },
    }
    const secondEvent = {
      type: 'Event2',
      payload: {
        hi: true,
      },
    }
    await Promise.all([
      eventStore.streamFromAll({
        lastCheckpoint: StreamPosition.Start,
        plugin,
      }),
      new Promise(async (resolve) => {
        await sleep(500)
        await eventStore.appendToStream({
          aggregateId,
          events: [firstEvent],
          expectedVersion: ExpectedVersion.NoStream,
        })
        resolve()
      }),
      new Promise(async (resolve) => {
        await sleep(1500)
        await eventStore.appendToStream({
          aggregateId,
          events: [secondEvent],
          expectedVersion: 1,
        })
        resolve()
      }),
      new Promise((resolve) =>
        plugin.on('checkpointReached', (data) => {
          try {
            assert.deepEqual(data, {
              checkpoint: 1,
              events: [{ ...firstEvent, aggregateId }],
            })
            plugin.emit('checkpointAdvanced')
            resolve()
            // eslint-disable-next-line no-empty
          } catch (err) {}
        })
      ),
      new Promise((resolve) =>
        plugin.on('checkpointReached', (data) => {
          try {
            assert.deepEqual(data, {
              checkpoint: 1,
              events: [{ ...firstEvent, aggregateId }],
            })
            plugin.emit('checkpointAdvanced')
            resolve()
            // eslint-disable-next-line no-empty
          } catch (err) {}
        })
      ),
    ])
  }).timeout(3000)
})
