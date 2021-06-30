const { assert } = require('chai')
const { pipe } = require('../auxiliary')
const { handleError } = require('./append-to-stream-core')

const genError = (code) =>
  pipe((error) => {
    // eslint-disable-next-line no-param-reassign
    error.code = code
    return error
  })(new Error(code))

describe('append to stream core', () => {
  it('should generate the next retry delay if code = 23505', () =>
    [...new Array(10)].map((_, index) =>
      pipe(
        () =>
          handleError({
            err: genError('23505'),
            attemptsMade: index,
            random: 0.36,
          }),
        (res) =>
          assert.deepEqual(res, {
            type: 'ConcurrencyViolationDetected',
            payload: {
              nextAttempt: index + 1,
              backoffDelay: 2 ** index * 0.36,
            },
          })
      )()
    ))
  it('should throw if attempts = 10', () =>
    pipe(
      () => handleError({ err: genError('23505'), attemptsMade: 10 }),
      (res) =>
        assert.deepEqual(res, {
          type: 'FailedToCorrectConcurrencyViolation',
          payload: { msg: 'Concurrency violation after 10 attempts' },
        })
    )())
  it('should throw if code not 23505', () =>
    pipe(
      () => handleError({ err: { name: 'RandomError' }, attemptsMade: 1 }),
      (res) =>
        assert.deepEqual(res, {
          type: 'UnknownErrorReceived',
          payload: { msg: 'RandomError' },
        })
    )())
})
