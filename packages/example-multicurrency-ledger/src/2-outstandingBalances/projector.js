const { EventEmitter } = require('events')
const { postgresProjector } = require('../_infrastructure/postgres-projector')
const { find, save } = require('./dao').outstandingBalancesDao
const { calculateLedgerBalances } = require('./pure')

module.exports.outstandingBalancesProjection = {
  start: () => {
    const transformer = new EventEmitter()
    transformer.on('eventsReceived', (events) =>
      find()
        .then(calculateLedgerBalances(events))
        .then(save)
        .then(() => transformer.emit('eventsProcessed'))
        .catch(console.error)
    )

    return postgresProjector.resumeReplication({
      name: 'calculateOutstandingBalances',
      transformer,
    })
  },
}
