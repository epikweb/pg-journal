const { assert } = require('chai')
const { log } = require('../src/logging')
const { client } = require('./config')

describe('Postgres client', () => {
  it('should begin a transaction at read committed isolation', () =>
    client
      .beginTransaction(async () => {
        await client.query(
          `insert into items(id, name, price) values(default, $1, $2)`,
          ['Health Potion', 12.25]
        )
        throw new Error('Business logic error')
      })
      .catch(async (err) => {
        log.error(err)
        return client
          .query(`select * from items`)
          .then((rows) => assert.equal(rows.length, 2))
      }))
})
