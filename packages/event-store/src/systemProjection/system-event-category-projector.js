const { SystemProjection } = require('../constants')

const prefix = '$category'
const marshalCategoryStreamId = (event) =>
  `${prefix}-${event.streamId.split('-')[0]}`
const isNotACategoryStream = (event) => !event.streamId.includes(prefix)

module.exports = ({ client }) => ({
  startEventCategoryProjector: () =>
    require('./system-projection-engine')({ client })
      .startSystemProjection({
        name: SystemProjection.EventCategory,
      })
      .on('eventsReadyForProcessing', ({ events, ack }) =>
        Promise.all(
          events.filter(isNotACategoryStream).map((e) =>
            require('../stream/append-to-stream')({ client }).appendToStream({
              streamId: marshalCategoryStreamId(e),
              events: [e],
            })
          )
        ).then(ack)
      )
      .on('error', (err) =>
        console.error(`Error in event category projection`, err)
      ),
})
