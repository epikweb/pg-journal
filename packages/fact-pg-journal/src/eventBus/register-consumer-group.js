const { log } = require('../logging')
const {assert} = require('chai')


module.exports = ({ client }) => ({
  registerConsumerGroup: ({ streamId, consumerGroupName }) => {
    const streamId = `event-bus-consumer-group@${streamSuffix}`

    const options = { client, isSystemStream: true }
    const { expectedVersion } = require('../stream/read-stream-forwards')(options).readStreamForwards({ streamId })
    assert.equal(expectedVersion, 0n, `This event type/consumer group name combination already exists (${streamId})`)


    return require('../stream/append-to-stream')(options).appendToStream({
      streamId,
      expectedVersion,
      events: [
        {
          type: 'ConsumerGroupRegistered',
          payload: {
            consumerGroupName
          }
        }
      ]
    })
  }
})
