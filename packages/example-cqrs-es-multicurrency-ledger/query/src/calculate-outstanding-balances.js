const { EventEmitter } = require('events')
const { saveLedgers } = require('./dao')
const { calculateLedgerBalances } = require('./core')
const { getLedgers } = require('./dao')
const { postgresProjector } = require('./infrastructure')

const transformer = new EventEmitter()
transformer.on('eventsReceived', (events) =>
  getLedgers()
    .then(calculateLedgerBalances(events))
    .then(saveLedgers)
    .then(() => transformer.emit('eventsProcessed'))
)

postgresProjector.resumeReplication({
  name: 'calculateOutstandingBalances',
  transformer,
})
