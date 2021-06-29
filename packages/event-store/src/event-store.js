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
    ...require('./persistentSubscription/connect-to-persistent-subscription')({
      client,
    }),

    ...require('./transientSubscription/subscribe-to-all')({ client }),
    ...require('./transientSubscription/subscribe-to-stream')({ client }),
  }
}
