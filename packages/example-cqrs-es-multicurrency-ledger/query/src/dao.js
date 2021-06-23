const { client } = require('./infrastructure')

const getLedgers = () =>
  client
    .query(`select * from ledgers`)
    .then(({ rows }) =>
      rows.map(({ currency, balance }) => ({ currency, balance }))
    )

const saveLedgers = (ledgers) =>
  Promise.all(
    ledgers.map(({ balance, currency }) =>
      client.query(
        `insert into ledgers(currency, balance) values($1, $2) on conflict (currency) do update set balance = $2`,
        [currency, balance]
      )
    )
  )

module.exports = {
  getLedgers,
  saveLedgers,
}
