/* eslint-disable */

const { getOutstandingBalances } = require('../src/2-outstandingBalances')
const { creditMoney } = require('../src/1-creditMoney')
const {
  outstandingBalancesProjection,
} = require('../src/2-outstandingBalances/projector')
const { resetTables } = require('./harness')
const { sleep } = require('../src/auxiliary')
const { assert } = require('chai')

const waitForReadModelState = (expectedOutput) =>
  new Promise((resolve) =>
    (function check() {
      getOutstandingBalances()
        .then((output) => {
          assert.deepEqual(output, expectedOutput)
        })
        .then(resolve)
        .catch((err) => {
          return sleep(2000).then(check)
        })
    })()
  )

describe('multicurrency ledger example', () => {
  beforeEach(resetTables)

  it('should eventually see consistent outstanding balances after crediting 10k monetary transactions', () => {
    const waitThenCredit =
      (delay, times) => (beneficiaryName, amount, currency) =>
        [...new Array(times)].map(
          (_) =>
            new Promise((resolve) =>
              sleep(Math.random() * delay)
                .then(() =>
                  creditMoney({
                    beneficiaryName,
                    amount,
                    currency,
                  })
                )
                .then(resolve)
            )
        )

    outstandingBalancesProjection.start({ pollInterval: 250, batchSize: 500 })
    return Promise.all([
      waitThenCredit(2500, 1)('lawrence', 5, 'PLN'),
      waitThenCredit(20, 2)('holo', 5, 'USD'),
      waitThenCredit(100, 3)('lawrence', 5, 'THB'),
      waitThenCredit(500, 4)('lawrence', 5, 'EUR'),
      waitThenCredit(10, 5)('holo', 5, 'CAD'),
      waitForReadModelState([
        { currency: 'CAD', balance: 25 },
        { currency: 'EUR', balance: 20 },
        { currency: 'THB', balance: 15 },
        { currency: 'USD', balance: 10 },
        { currency: 'PLN', balance: 5 },
      ]),
    ])
  }).timeout(60000)
})
