const { postgresProjector } = require('./infrastructure')
const { find, save } = require('./2-outstanding-balances-dao').outstandingBalancesDao
const { calculateLedgerBalances } = require('./2-outstanding-balances-core')

module.exports.outstandingBalancesProjection = {
  start: ({ pollInterval = 5000, batchSize = 5000 }) => {
    const projection = postgresProjector.start({
      name: 'calculateOutstandingBalances',
      pollInterval,
      batchSize,
    })

    projection.on('eventsReadyForProcessing', ({ events, ack }) =>
      find()
        .then(calculateLedgerBalances(events))
        .then(save)
        .then(ack)
        .catch(console.error)
    )
    projection.on('error', (error) => {
      console.error(`outstandingBalancesProjection error`, error)
      process.exit(0)
    })
  },
}
