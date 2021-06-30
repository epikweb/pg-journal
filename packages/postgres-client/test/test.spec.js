const { arrangeSut } = require('./bootstrap')
const { assert } = require('chai')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
describe('Postgres client', () => {
  let sut
  beforeEach(() => arrangeSut().then((_sut) => (sut = _sut)))
  it('should rollback a transaction at read committed isolation', async () =>
    sut
      .beginTransaction(async () => {
        await sut.query(
          `insert into items(id, name, price) values(default, $1, $2)`,
          ['Health Potion', 12.25]
        )
        return Promise.reject(new Error('Business logic error'))
      })
      .catch(() =>
        sut
          .single(`select count(*) as count from items`)
          .then(({ count }) => assert.equal(count, 2))
      ))

  it('should complete 5 concurrent transactions at repeatable read isolation with 5 clients', async () =>
    Promise.all(
      [...new Array(5)].map(
        (_) =>
          new Promise((resolve) => {
            ;(function retry() {
              sut
                .beginTransaction(
                  () =>
                    sut
                      .single(`select price from items where name = 'Sword'`)
                      .then(({ price }) =>
                        sut.query(
                          `update items set price = $1 where name = 'Sword'`,
                          [parseFloat(price) + 5]
                        )
                      ),
                  { isolationLevel: 'REPEATABLE READ' }
                )
                .then(resolve)
                .catch((err) =>
                  // phantom read
                  err.code === '40001' &&
                  err.message ===
                    'could not serialize access due to concurrent update'
                    ? sleep(Math.random() * 500).then(retry)
                    : Promise.reject(err)
                )
            })()
          })
      )
    )
      // any non repeatable reads will cause not to be 30
      .then(() => sut.single(`select price from items where name = 'Sword'`))
      .then(({ price }) => assert.equal(price, 30)))
  it('should complete 5 concurrent transactions at serializable isolation with 5 clients', () => {
    let faults = 0
    return Promise.all(
      [...new Array(5)].map(
        (_) =>
          new Promise((resolve) => {
            ;(function retry() {
              sut
                .beginTransaction(
                  () =>
                    sut
                      .single(`select sum(price) from items`)
                      .then(() =>
                        sut.query(
                          `insert into items(id, name, price) values(default, $1, $2)`,
                          ['Test', 12.25]
                        )
                      ),
                  { isolationLevel: 'SERIALIZABLE' }
                )
                .then(resolve)
                .catch((err) => {
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
      .then(() => sut.single(`select count(*) as count from items`))
      .then(({ count }) => {
        assert.equal(count, 7)
        assert.isAtLeast(faults, 1)
      })
  })
  it('should release clients at the end of a regular query', () =>
    Promise.all(
      [...new Array(100)].map((_) => sut.query(`select * from items`))
    ))

  it('should release clients at the end of a transaction', () =>
    Promise.all(
      [...new Array(100)].map((_) =>
        sut.beginTransaction(() => sut.query(`select * from items`))
      )
    ))
})
