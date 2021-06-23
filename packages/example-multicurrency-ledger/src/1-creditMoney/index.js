const { ExpectedVersion } = require('@pg-journal/event-store')
const { eventStore } = require('../_infrastructure/event-store')

module.exports.creditMoney = ({ beneficiaryName, amount, currency }) =>
  eventStore.appendToStream({
    aggregateId: beneficiaryName,
    events: [{ type: 'Credited', payload: { amount, currency } }],
    expectedVersion: ExpectedVersion.NoStream,
  })
