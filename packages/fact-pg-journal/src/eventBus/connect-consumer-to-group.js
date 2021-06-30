const { log } = require('../logging')
const {assert} = require('chai')
const { v4 } = require('uuid')

const getState = ({ client, streamId, consumerGroupName }) =>
  client.query(`select checkpoint from pg_journal_consumer_groups where stream_id = $1 and consumer_group_name = $2`, [streamId, consumerGroupName])

const takeLock = ({ client, checkpoint, batchSize }) => {

}


const beginProcessingEvents = ({ client, streamId, consumerGroupName }) =>  (function process() {
  getState({ client, streamId, consumerGroupName })
    .then(
      checkpoint => takeLock({ client, checkpoint, streamId, batchSize })
    )
    .catch(console.error)
    .finally(process)
})()

module.exports = ({ client }) => ({
  connectConsumerToGroup: ({ streamId, consumerGroupName }) => {
    log.info(
      `Registering topic for stream id: ${streamId} for consumer group ${consumerGroupName}`
    )

    return beginProcessingEvents({ client, consumerGroupName, streamId })
  }
})
