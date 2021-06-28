const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x)

module.exports.prepareReport = ({
  appendTimes,
  startTime,
  eventsWritten,
  finishTime = Date.now(),
}) =>
  pipe(
    () => ({
      elapsedSeconds: Math.floor((finishTime - startTime) / 1000),
      averageAppendLatency:
        appendTimes.reduce((total, r) => r + total, 0) / appendTimes.length,
    }),
    ({ elapsedSeconds, averageAppendLatency }) => ({
      elapsedSeconds,
      averageAppendLatency,
      writesPerSecond: parseFloat(eventsWritten / elapsedSeconds).toFixed(8),
    }),
    ({ elapsedSeconds, averageAppendLatency, writesPerSecond }) => `
=========================================================
${elapsedSeconds}s elapsed

${writesPerSecond} appends/sec
${averageAppendLatency}ms average append latency
=========================================================
    `
  )()
