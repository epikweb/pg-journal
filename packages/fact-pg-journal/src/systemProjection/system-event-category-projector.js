const { SystemProjection } = require('../constants')

const marshalCategoryStreamId = (event) =>
  `event-category-${event.streamId.split('-')[0]}`

module.exports = ({ client }) => ({
  startEventCategoryProjector: () =>
    require('./system-projection-engine')({ client })
      .startSystemProjection({
        name: SystemProjection.EventCategory,
      })
      .on('eventsReadyForProcessing', ({ events, ack }) =>
        Promise.all(
          events.map((e) =>
            require('../stream/append-to-stream')({
              client,
              isSystemStream: true,
            }).appendToStream({
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
