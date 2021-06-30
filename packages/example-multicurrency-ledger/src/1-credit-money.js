const { eventStore } = require('./infrastructure')

module.exports.creditMoney = ({ beneficiaryName, amount, currency }) => {
  eventStore
    .readStreamForwards({ streamId: beneficiaryName })
    .then(({ expectedVersion }) =>
      eventStore.appendToStream({
        streamId: beneficiaryName,
        events: [{ type: 'Credited', payload: { amount, currency } }],
        expectedVersion,
      })
    )
}
