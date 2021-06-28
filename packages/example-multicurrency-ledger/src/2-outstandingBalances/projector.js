const { postgresProjector } = require('../_infrastructure')
const { find, save } = require('./dao').outstandingBalancesDao
const { calculateLedgerBalances } = require('./pure')

module.exports.outstandingBalancesProjection = {
  start: ({ pollInterval = 5000, batchSize = 5000 }) => {
    const projection = postgresProjector.start({
      name: 'calculateOutstandingBalances',
      pollInterval,
      batchSize,
    })
    projection.on('eventsReadyForProcessing', ({ events, ack }) =>
      find().then(calculateLedgerBalances(events)).then(save).then(ack)
    )
    projection.on('error', (error) => {
      console.error(`outstandingBalancesProjection error`, error)
      process.exit(0)
    })
  },
}
