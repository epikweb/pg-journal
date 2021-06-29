const { sleep } = require('./core')
const { pipe } = require('./core')
const { bytesToSize } = require('./core')
const { cpus, totalmem } = require('os')
const { spawn } = require('child_process')

module.exports.runCommand = (cmd, args, env) => {
  console.log(`Running shell cmd`, cmd, args)
  const ls = spawn(cmd, args, {
    env: {
      ...process.env,
      ...env,
    },
    cwd: __dirname,
  })

  return new Promise((resolve, reject) => {
    ls.stdout.on('data', (data) => {
      console.log(`stdout: ${data.toString()}`)
    })

    ls.stderr.on('data', (data) => {
      console.log(`stderr: ${data.toString()}`)
      if (data.toString().includes('No such container')) {
        resolve()
      }
    })

    ls.on('exit', (code) => {
      console.log(`child process exited with code ${code.toString()}`)
      if (code === 0) {
        resolve()
      }
    })
  })
}
module.exports.benchmarkWrites = (
  append,
  { eventsToWrite, timeoutMs, concurrent = false }
) => {
  const startTime = Date.now()
  const appendTimes = []
  let eventsWritten = 0

  return Promise.race([
    new Promise((resolve) =>
      [...new Array(eventsToWrite)].map(async (_) => {
        if (!concurrent) await sleep(Math.random() * timeoutMs)

        const appendStart = Date.now()
        return append()
          .then(() => {
            appendTimes.push(Date.now() - appendStart)
            eventsWritten += 1

            if (eventsWritten >= eventsToWrite) {
              resolve()
            }
          })
          .catch(console.error)
      })
    ),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]).then(() => ({
    appendTimes,
    startTime,
    eventsWritten,
  }))
}

module.exports.saveWriteBenchmark = ({
  appendTimes,
  startTime,
  eventsWritten,
  finishTime = Date.now(),
  image,
  benchmarkName,
  metadata,
}) =>
  pipe(
    () => ({
      elapsedSeconds: Math.floor((finishTime - startTime) / 1000),
      averageAppendLatency:
        appendTimes.reduce((total, r) => r + total, 0) / appendTimes.length,
    }),
    ({ elapsedSeconds, averageAppendLatency }) => ({
      averageAppendLatency,
      writesPerSecond: parseFloat(eventsWritten / elapsedSeconds).toFixed(4),
    }),
    ({ averageAppendLatency, writesPerSecond }) =>
      require('fs').writeFileSync(
        require('path').join(
          __dirname,
          `${benchmarkName}-${image.replace(/:|\//g, '-')}-${finishTime}.json`
        ),
        JSON.stringify(
          {
            elapsedMs: finishTime - startTime,
            averageAppendLatency,
            writesPerSecond,
            benchmarkName,
            eventsWritten,
            cpu: cpus()[0].model,
            cpuCores: cpus().length,
            ram: bytesToSize(totalmem()),
            metadata,
          },
          null,
          4
        )
      )
  )()

module.exports.saveReadBenchmark = ({
  eventsRead,
  startTime,
  finishTime = Date.now(),
  image,
  benchmarkName,
  metadata,
}) =>
  pipe(
    () => ({
      elapsedMs: finishTime - startTime,
    }),
    ({ elapsedMs }) => ({
      readsPerSecond: parseFloat((eventsRead / elapsedMs) * 1000).toFixed(4),
    }),
    ({ readsPerSecond }) =>
      require('fs').writeFileSync(
        require('path').join(
          __dirname,
          `${benchmarkName}-${image.replace(/:|\//g, '-')}-${finishTime}.json`
        ),
        JSON.stringify(
          {
            eventsRead,
            elapsedMs: finishTime - startTime,
            readsPerSecond,
            benchmarkName,
            cpu: cpus()[0].model,
            cpuCores: cpus().length,
            ram: bytesToSize(totalmem()),
            metadata,
          },
          null,
          4
        )
      )
  )()
