const { takeNextEventBatch } = require('./take-next-event-batch')
const { calculateFreeTime } = require('./core')
const { log } = require('../logging')
const { sleep } = require('../auxiliary')

module.exports = ({ client, schemaName }) => ({
  streamFromAll: ({
    batchSize = 500,
    pollInterval = 250,
    lastCheckpoint,
    plugin,
  }) => {
    // eslint-disable-next-line no-unused-vars
    let cancelled = false
    ;(async function poll(checkpoint, start = Date.now()) {
      log.debug(`Begin poll`)
      const { events, nextCheckpoint } = await takeNextEventBatch({
        client,
        schemaName,
        checkpoint,
        batchSize,
      })

      log.info(events)
      if (checkpoint !== nextCheckpoint) {
        await new Promise((resolve) => {
          plugin.emit('checkpointReached', {
            checkpoint: nextCheckpoint,
            events,
          })

          plugin.on('checkpointAdvanced', resolve)
        })
      }

      const freeTime = calculateFreeTime({ start, pollInterval })
      await sleep(freeTime)
      log.debug(`End poll`)

      if (!cancelled) {
        poll(nextCheckpoint)
      }
    })(lastCheckpoint)

    return {
      stopStreaming: () => {
        cancelled = true
      },
      resumeStreaming: () => {
        cancelled = false
      },
    }
  },
})
