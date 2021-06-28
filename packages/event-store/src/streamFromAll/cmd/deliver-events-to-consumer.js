const { log } = require('../../logging')

module.exports.deliverEventsToConsumer = ({
  emitter,
  events,
  nextCheckpoint,
}) =>
  new Promise((resolve) => {
    log.debug(`Delivering`, {
      nextCheckpoint,
    })

    emitter.emit('eventsAppeared', {
      events,
      checkpoint: nextCheckpoint,
      ack: resolve,
    })
  })
