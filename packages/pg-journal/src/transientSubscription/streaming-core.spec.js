const { assert } = require('chai')
const { poll } = require('./streaming-core')

describe('poll', () => {
  it('should a advance the checkpoint to the current one when there are no events', () => {
    assert.deepEqual(
      poll({
        events: [],
        currentCheckpoint: 5n,
        now: '2021-06-26 05:00:41.134631 +00:00',
      }),
      [
        {
          type: 'CheckpointAdvanced',
          payload: {
            nextCheckpoint: 5n,
          },
        },
      ]
    )
  })
  it('should correctly calculate the next checkpoint when there are events and a gap', () => {
    const input = {
      events: [
        {
          streamId: 'holo',
          globalIndex: 1n,
          type: 'Credited',
          payload: { amount: 5 },
          sequenceNumber: 0n,
          timestamp: '2021-06-26 05:00:35.134630 +00:00',
        },
        {
          streamId: 'holo',
          globalIndex: 3n,
          type: 'Credited',
          payload: { amount: 5 },
          sequenceNumber: 0n,
          timestamp: '2021-06-26 05:00:37.134629 +00:00',
        },
        {
          streamId: 'holo',
          globalIndex: 5n,
          type: 'Credited',
          payload: { amount: 5 },
          sequenceNumber: 0n,
          timestamp: '2021-06-26 05:00:37.134630 +00:00',
        },
      ],
      currentCheckpoint: BigInt(0),
      now: '2021-06-26 05:00:37.134631 +00:00',
    }

    const output = poll(input)

    console.dir(output, { depth: null })
    assert.deepEqual(output, [
      {
        type: 'ConsumerDeliveryRequested',
        payload: {
          events: [
            {
              streamId: 'holo',
              type: 'Credited',
              payload: { amount: 5 },
              sequenceNumber: 0n,
            },
          ],
          nextCheckpoint: 1n,
        },
      },
      { type: 'CheckpointAdvanced', payload: { nextCheckpoint: 1n } },
    ])
  })
})
