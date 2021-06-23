/* eslint-disable */

const { db } = require('../../../projector-postgres/src/store')
const {
  buildReducer,
  pipe,
} = require('../../../projector-postgres/src/auxiliary')

const findOrAddLedger = (ledgers, currency) =>
  pipe(
    () => ledgers.find((l) => l.currency === currency),
    (ledger) => (ledger ? ledgers : [...ledgers, { currency, balance: 0 }])
  )()
const bookLedger = (ledgers, currency, amount) =>
  pipe(
    () => ledgers.find((l) => l.currency === currency),
    (ledger) => [
      ...ledgers.filter((l) => l.currency !== currency),
      {
        ...ledger,
        balance: ledger.balance + amount,
      },
    ]
  )()
const calculateLedgerBalances = (events) => (ledgers) =>
  buildReducer(ledgers, {
    Debited: (ledgers, event) =>
      pipe(
        () => findOrAddLedger(ledgers, event.payload.currency),
        (ledgers) =>
          bookLedger(ledgers, event.payload.currency, -event.payload.amount)
      )(),
    Credited: (ledgers, event) =>
      pipe(
        () => findOrAddLedger(ledgers, event.payload.currency),
        (ledgers) =>
          bookLedger(ledgers, event.payload.currency, event.payload.amount)
      )(),
  })(events)

module.exports = {
  calculateLedgerBalances,
}
