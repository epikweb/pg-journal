const { SystemProjection } = require('./constants')

module.exports.EventStore = ({ client, enabledSystemProjections = [] }) => {
  if (enabledSystemProjections.includes(SystemProjection.EventCategory))
    require('./systemProjection/system-event-category-projector')({
      client,
    }).startEventCategoryProjector()

  if (enabledSystemProjections.includes(SystemProjection.EventType)) {
  }

  return {
    ...require('./stream/append-to-stream')({ client }),
    ...require('./stream/read-stream-forwards')({ client }),
    ...require('./eventBus/register-consumer-group')({
      client,
    }),
    ...require('./eventBus/connect-consumer-to-group')({
      client,
    }),
    ...require('./transientSubscription/subscribe-to-all')({ client }),
    ...require('./systemProjection/subscribe-to-system-stream')({
      client,
    }),
  }
}
