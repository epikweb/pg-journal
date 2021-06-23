const { printMoney } = require('./print-money-core')
const { ExpectedVersion } = require('../../../event-store')
const { eventStore } = require('./infrastructure')

module.exports.creditMoney = ({ beneficiaryName, random = Math.random() }) =>
  eventStore.appendToStream({
    aggregateId: beneficiaryName,
    events: printMoney(random),
    expectedVersion: ExpectedVersion.NoStream,
  })
