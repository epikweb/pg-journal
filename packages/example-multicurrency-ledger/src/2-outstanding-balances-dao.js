const { postgresProjectorClient } = require('./infrastructure')

const find = () =>
  postgresProjectorClient.query(`select * from ledgers`).then((rows) =>
    rows
      .map(({ currency, balance }) => ({
        currency,
        balance: parseFloat(balance),
      }))
      .sort((a, b) => b.balance - a.balance)
  )

const save = (ledgers) =>
  Promise.all(
    ledgers.map(({ balance, currency }) =>
      postgresProjectorClient.query(
        `insert into ledgers(currency, balance) values($1, $2) on conflict (currency) do update set balance = $2`,
        [currency, balance]
      )
    )
  )

module.exports.outstandingBalancesDao = {
  find,
  save,
}
