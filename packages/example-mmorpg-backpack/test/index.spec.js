const { assert } = require('chai')
const { registerPlayer } = require('../src/player/1-register')
const { StreamPosition } = require('../../../src/constants')
const { EventStore, ProjectionStore } = require('../../../src')
const { arrangeDatabase, connectionString, pool } = require('./_harness')

describe('examples backpack example', () => {
  it('should register two players, createDatabase an itemTemplate, then add it the itemTemplate to both of the players inventories', async () => {
    const sora = await registerPlayer({
      username: 'sora',
      password: '123',
    })
    const kairi = await registerPlayer({
      username: 'kairi',
      password: '456',
    })
  })
})
