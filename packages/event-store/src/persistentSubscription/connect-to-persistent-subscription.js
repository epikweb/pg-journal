const { StreamPosition } = require('../constants')
const { log } = require('../logging')
const { v4 } = require('uuid')
const { EventEmitter } = require('events')

const recover = ({ client, emitter, streamId, nodeId, consumerGroupName }) =>
  client
    .single(
      `
                insert into pg_journal_persistent_subscriptions(checkpoint, stream_id, consumer_group_name)
                values($1, $2, $3)
                on conflict(stream_id, consumer_group_name) do nothing
                returning checkpoint
      `,
      [StreamPosition.Start, streamId, consumerGroupName, nodeId]
    )
    .then(({ checkpoint }) => checkpoint)
    .catch((err) => {
      console.error(`An error occurred recovering checkpoint`, err)
      emitter.emit('error', err)
    })

module.exports = ({ client }) => ({
  connect: ({ streamId, consumerGroupName }) => {
    const nodeId = v4()
    log.info(
      `Subscribing to ${streamId} with consumer group name ${consumerGroupName} on node ${nodeId}`
    )

    const emitter = new EventEmitter()

    recover({ client, emitter, streamId, nodeId, consumerGroupName })
      .then((checkpoint) => emitter.emit('connected', { checkpoint }))
      .then(() => {
        console.log('Now processing events...')
      })

    return emitter
  },
})
