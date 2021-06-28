const { assert } = require('chai')
const { findVisibleEvents } = require('./gap-detection')

describe('gap detection', () => {
  it('should find gaps and retrieve visible events', () => {
    const events = findVisibleEvents({
      events: [
        {
          globalIndex: 1,
          timestamp: '2021-06-26 05:00:35.134630 +00:00',
        },
        {
          globalIndex: 3,
          timestamp: '2021-06-26 05:00:36.134630 +00:00',
        },
        {
          globalIndex: 5,
          timestamp: '2021-06-26 05:00:37.134630 +00:00',
        },
        {
          globalIndex: 7,
          timestamp: '2021-06-26 05:00:39.594630 +00:00',
        },
        {
          globalIndex: 8,
          timestamp: '2021-06-26 05:00:40.034630 +00:00',
        },
        {
          globalIndex: 9,
          timestamp: '2021-06-26 05:00:41.104630 +00:00',
        },
        {
          globalIndex: 11,
          timestamp: '2021-06-26 05:00:41.554630 +00:00',
        },
      ],
      currentCheckpoint: 0,
      now: '2021-06-26 05:00:41.564631 +00:00',
    })

    assert.deepEqual(events, [
      { globalIndex: 1, timestamp: '2021-06-26 05:00:35.134630 +00:00' },
      { globalIndex: 3, timestamp: '2021-06-26 05:00:36.134630 +00:00' },
      { globalIndex: 5, timestamp: '2021-06-26 05:00:37.134630 +00:00' },
      { globalIndex: 7, timestamp: '2021-06-26 05:00:39.594630 +00:00' },
      { globalIndex: 8, timestamp: '2021-06-26 05:00:40.034630 +00:00' },
      { globalIndex: 9, timestamp: '2021-06-26 05:00:41.104630 +00:00' },
    ])
  })
  it('should return no visible events with only 1 event and a gap', () => {
    const events = findVisibleEvents({
      events: [
        {
          globalIndex: 3,
          timestamp: '2021-06-26 05:00:35.134630 +00:00',
        },
      ],
      currentCheckpoint: 1,
      now: '2021-06-26 05:00:35.134631 +00:00',
    })
    assert.deepEqual(events, [])
  })
  it('should work correctly with 3 events and a gap in the second', () => {
    const events = findVisibleEvents({
      currentCheckpoint: 0,
      events: [
        {
          globalIndex: 1,
          timestamp: '2021-06-26T12:41:52.053Z',
        },
        {
          globalIndex: 3,
          timestamp: '2021-06-26T12:41:52.071Z',
        },
        {
          globalIndex: 4,
          timestamp: '2021-06-26T12:41:52.144Z',
        },
      ],
      now: '2021-06-26T12:41:52.305Z',
    })
    assert.deepEqual(events, [
      {
        globalIndex: 1,
        timestamp: '2021-06-26T12:41:52.053Z',
      },
    ])
  })
  it('should work correctly with 3 events and no gaps', () => {
    const events = findVisibleEvents({
      currentCheckpoint: 0,
      events: [
        {
          globalIndex: 1,
          timestamp: '2021-06-26T12:41:52.053Z',
        },
        {
          globalIndex: 2,
          timestamp: '2021-06-26T12:41:52.071Z',
        },
        {
          globalIndex: 3,
          timestamp: '2021-06-26T12:41:52.144Z',
        },
      ],
      now: '2021-06-26T12:41:52.305Z',
    })
    assert.deepEqual(events, [
      {
        globalIndex: 1,
        timestamp: '2021-06-26T12:41:52.053Z',
      },
      {
        globalIndex: 2,
        timestamp: '2021-06-26T12:41:52.071Z',
      },
      {
        globalIndex: 3,
        timestamp: '2021-06-26T12:41:52.144Z',
      },
    ])
  })
})
