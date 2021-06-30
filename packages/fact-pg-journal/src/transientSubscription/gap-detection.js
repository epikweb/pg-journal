const { maximumCommitDelayMs } = require('../constants')

const computeMillisUntilSafe = (now, timestamp) =>
  Math.min(
    maximumCommitDelayMs -
      (new Date(now).getTime() - new Date(timestamp).getTime()),
    maximumCommitDelayMs
  )

module.exports.findVisibleEvents = ({ currentCheckpoint, events, now }) => {
  const benchmark = (name) => data => 
    // log.info(name, `+${Date.now() - new Date(now).getTime()}ms`)
     data

  return events.filter(e => computeMillisUntilSafe(now, e.timestamp) < 0)
}