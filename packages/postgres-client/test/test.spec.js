const { assert } = require('chai')
const { cleanTables, seedTables, constructClient } = require('./harness')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
describe('Postgres client', () => {
  it('should rollback a transaction at read committed isolation', async () => {
    const client = constructClient()
    await cleanTables(client)
    await seedTables(client)

    return client
      .beginTransaction(async () => {
        await client.query(
          `insert into items(id, name, price) values(default, $1, $2)`,
          ['Health Potion', 12.25]
        )
        return Promise.reject(new Error('Business logic error'))
      })
      .catch(() =>
        client
          .single(`select count(*) as count from items`)
          .then(({ count }) => assert.equal(count, 2))
      )
  })
  it('should complete 5 concurrent transactions at repeatable read isolation with 5 clients', async () => {
    const client = constructClient({ poolSize: 5 })
    await cleanTables(client)
    await seedTables(client)

    return (
      Promise.all(
        [...new Array(5)].map(
          (_) =>
            new Promise((resolve) => {
              ;(function retry() {
                client
                  .beginTransaction(
                    () =>
                      client
                        .single(`select price from items where name = 'Sword'`)
                        .then(({ price }) =>
                          client.query(
                            `update items set price = $1 where name = 'Sword'`,
                            [parseFloat(price) + 5]
                          )
                        ),
                    { isolationLevel: 'REPEATABLE READ' }
                  )
                  .then(resolve)
                  .catch((err) => {
                    console.error(err)
                    // phantom read
                    return err.code === '40001' &&
                      err.message ===
                        'could not serialize access due to concurrent update'
                      ? sleep(Math.random() * 500).then(retry)
                      : Promise.reject(err)
                  })
              })()
            })
        )
      )
        // any non repeatable reads will cause not to be 30
        .then(() =>
          client.single(`select price from items where name = 'Sword'`)
        )
        .then(({ price }) => assert.equal(price, 30))
    )
  })
  it('should complete 5 concurrent transactions at serializable isolation with 5 clients', async () => {
    const client = constructClient({ poolSize: 5 })
    await cleanTables(client)
    await seedTables(client)

    let faults = 0
    return Promise.all(
      [...new Array(5)].map(
        (_) =>
          new Promise((resolve) => {
            ;(function retry() {
              client
                .beginTransaction(
                  () =>
                    client
                      .single(`select sum(price) from items`)
                      .then(() =>
                        client.query(
                          `insert into items(id, name, price) values(default, $1, $2)`,
                          ['Test', 12.25]
                        )
                      ),
                  { isolationLevel: 'SERIALIZABLE' }
                )
                .then(resolve)
                .catch((err) => {
                  console.error(err)
                  const isSerializationAnomaly =
                    err.code === '40001' &&
                    err.message ===
                      'could not serialize access due to read/write dependencies among transactions'

                  if (isSerializationAnomaly) {
                    faults += 1
                  }

                  return isSerializationAnomaly
                    ? sleep(Math.random() * 500).then(retry)
                    : Promise.reject(err)
                })
            })()
          })
      )
    )
      .then(() => client.single(`select count(*) as count from items`))
      .then(({ count }) => {
        assert.equal(count, 7)
        assert.isAtLeast(faults, 1)
      })
  })
  it('should release clients at the end of a regular query', () => {
    const client = constructClient({ poolSize: 1 })

    return Promise.all(
      [...new Array(100)].map((_) => client.query(`select * from items`))
    )
  })

  it('should release clients at the end of a transaction', () => {
    const client = constructClient({ poolSize: 1 })
    return Promise.all(
      [...new Array(100)].map((_) =>
        client.beginTransaction(() => client.query(`select * from items`))
      )
    )
  })
})
