/* eslint-disable */

const { getOutstandingBalances } = require('../src/2-outstandingBalances')
const { creditMoney } = require('../src/1-creditMoney')
const {
  outstandingBalancesProjection,
} = require('../src/2-outstandingBalances/projector')
const { resetTables } = require('./harness')
const { sleep } = require('../src/auxiliary')
const { assert } = require('chai')

describe('multicurrency ledger example', () => {
  beforeEach(resetTables)

  it('should eventually see consistent outstanding balances after crediting some money', () => {
    const waitForConsistency = () =>
      new Promise((resolve) =>
        (function check() {
          getOutstandingBalances()
            .then((output) => {
              console.log(output)
              assert.deepEqual(output, [
                { currency: 'CAD', balance: '25.00' },
                { currency: 'THB', balance: '4312.00' },
                { currency: 'EUR', balance: '929.00' },
              ])
            })
            .then(resolve)
            .catch((err) => sleep(500).then(check))
        })()
      )

    const waitThenCredit = (delay) => (beneficiaryName, amount, currency) =>
      new Promise((resolve) =>
        sleep(delay)
          .then(() =>
            creditMoney({
              beneficiaryName,
              amount,
              currency,
            })
          )
          .then(resolve)
      )

    outstandingBalancesProjection.start()
    return Promise.all([
      waitThenCredit(10)('spice', 5, 'CAD'),
      waitThenCredit(20)('spice', 20, 'CAD'),
      waitThenCredit(100)('wolf', 4312, 'THB'),
      waitThenCredit(500)('wolf', 464, 'EUR'),
      waitThenCredit(650)('wolf', 465, 'EUR'),
      waitForConsistency(),
    ])
  }).timeout(60000)
})
