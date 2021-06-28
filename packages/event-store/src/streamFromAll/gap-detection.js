const { tap } = require('../auxiliary')
const { maximumCommitDelayMs } = require('../constants')
const { CoreEvent } = require('./constants')
const { pipe } = require('../auxiliary')

const computeMillisUntilSafe = (now, timestamp) =>
  Math.min(
    maximumCommitDelayMs -
      (new Date(now).getTime() - new Date(timestamp).getTime()),
    maximumCommitDelayMs
  )

const Event = {
  GapDetected: 'GapDetected',
  EventDetected: 'EventDetected',
}

module.exports.findVisibleEvents = ({ currentCheckpoint, events, now }) =>
  pipe(
    () => events[events.length - 1].globalIndex,
    (lastGlobalIndex) => lastGlobalIndex - currentCheckpoint,
    (expectedNumberOfEvents) =>
      [...new Array(expectedNumberOfEvents)].map(
        (_, index) => index + currentCheckpoint + 1
      ),
    (expectedEvents) =>
      expectedEvents.map((globalIndex) =>
        pipe(
          () => ({
            exactMatch: events.find((e) => e.globalIndex === globalIndex),
            nextHighestMatch: events.find((e) => e.globalIndex > globalIndex),
            globalIndex,
          }),
          ({ exactMatch, nextHighestMatch, globalIndex }) =>
            exactMatch
              ? {
                  type: Event.EventDetected,
                  payload: {
                    event: exactMatch,
                    millisUntilSafe: computeMillisUntilSafe(
                      now,
                      exactMatch.timestamp
                    ),
                  },
                }
              : {
                  type: Event.GapDetected,
                  payload: {
                    globalIndex,
                    millisUntilSafe: computeMillisUntilSafe(
                      now,
                      nextHighestMatch.timestamp
                    ),
                  },
                }
        )()
      ),
    (events) => ({
      safeEvents: events.filter(
        (e) => e.type === Event.EventDetected && e.payload.millisUntilSafe <= 0
      ),
      unsafeEvents: events.filter(
        (e) => e.type === Event.EventDetected && e.payload.millisUntilSafe > 0
      ),
      unsafeGaps: events.filter(
        (e) => e.type === Event.GapDetected && e.payload.millisUntilSafe > 0
      ),
    }),
    ({ safeEvents, unsafeEvents, unsafeGaps }) =>
      unsafeGaps.length > 0
        ? [
            ...safeEvents,
            ...unsafeEvents.filter(
              (e) =>
                e.payload.event.globalIndex < unsafeGaps[0].payload.globalIndex
            ),
          ]
        : [...safeEvents, ...unsafeEvents],
    (visibleEvents) => visibleEvents.map((e) => e.payload.event)
  )()
