// How do we handle this combinatorial explosion of message bus contracts? Doesnt it make the projector non-autonomous?
module.exports.printMoney = (random) => {
  if (random < 0.3) {
    return [{ type: 'Credited', payload: { amount: 5 } }]
  }
  if (random < 0.6) {
    return [
      { type: 'Credited', payload: { amount: 5 } },
      { type: 'Credited', payload: { amount: 10 } },
    ]
  }
  return [
    { type: 'Credited', payload: { amount: 5 } },
    { type: 'Credited', payload: { amount: 10 } },
    { type: 'Credited', payload: { amount: 15 } },
  ]
}
