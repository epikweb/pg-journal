const { eventStore } = require('../_infrastructure')

module.exports.creditMoney = ({ beneficiaryName, amount, currency }) => {
  eventStore
    .readStreamForwards({ aggregateId: beneficiaryName })
    .then(({ expectedVersion }) =>
      eventStore.appendToStream({
        aggregateId: beneficiaryName,
        events: [{ type: 'Credited', payload: { amount, currency } }],
        expectedVersion,
      })
    )
}
