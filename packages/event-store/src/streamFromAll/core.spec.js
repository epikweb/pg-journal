const { assert } = require('chai')
const { poll } = require('./core')

describe('poll', () => {
  it('should a advance the checkpoint to the current one when there are no events', () => {
    assert.deepEqual(
      poll({
        events: [],
        currentCheckpoint: 5,
        now: '2021-06-26 05:00:41.134631 +00:00',
      }),
      [
        {
          type: 'CheckpointAdvanced',
          payload: {
            nextCheckpoint: 5,
          },
        },
      ]
    )
  })
})
