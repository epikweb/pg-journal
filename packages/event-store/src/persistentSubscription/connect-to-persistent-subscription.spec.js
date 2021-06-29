const { pipe } = require('../auxiliary')
const { constructEventStore } = require('../../test/harness')
const { assert } = require('chai')
const { cleanTables } = require('../../test/harness')
const { ExpectedVersion } = require('../constants')

describe('subscribe', () => {
  beforeEach(cleanTables)
  it('should persistentSubscription 3 consumer groups to a stream, receiving a load balanced # of events based on the # of processing nodes', async () => {
    const eventStore = constructEventStore()

    const eventsToWrite = 1000
    const consumerGroups = [
      { groupName: 'alpha', nodes: 1 },
      { groupName: 'beta', nodes: 2 },
      { groupName: 'charlie', nodes: 4 },
    ]

    const streamId = 'wallet-123'
    await eventStore.appendToStream({
      streamId,
      events: [
        { type: 'Credited', payload: { amount: 5 } },
        { type: 'Debited', payload: { amount: 5 } },
        { type: 'Credited', payload: { amount: 5 } },
      ],
      expectedVersion: ExpectedVersion.NoStream,
    })

    await Promise.all(
      consumerGroups.map(({ groupName, nodes }) =>
        Promise.all(
          [...new Array(nodes)].map(
            (_, index) =>
              new Promise((resolve) =>
                pipe(
                  () => index + 1,
                  (nodeId) => {
                    const expectedNumberOfReads = eventsToWrite / nodes
                    console.log(
                      `Consumer group ${groupName} node id ${nodeId} is expected to receive ${expectedNumberOfReads} events. Subscribing...`
                    )

                    const subscription = eventStore.subscribe({
                      streamId,
                      consumerGroupName: groupName,
                    })
                    subscription.on('connected', console.log)
                    subscription.on('error', console.error)

                    const uniqueEventIdsRead = []
                    console.log(
                      `Consumer connected to group ${groupName} on node id ${nodeId}`
                    )
                    subscription.on(
                      'eventsAppeared',
                      async ({ events, ack }) => {
                        // eslint-disable-next-line no-restricted-syntax
                        for (const event of events) {
                          if (uniqueEventIdsRead.includes(event.event.id)) {
                            console.log(
                              `Consumer group ${groupName} received duplicate event ${event.event.id} on node id ${nodeId}, skipping...`
                            )
                          } else {
                            uniqueEventIdsRead.push(event.event.id)
                            console.log(
                              `Consumer group ${groupName} received new event ${event.event.id} on node id ${nodeId}, acknowledging...`
                            )

                            await ack()
                            console.log(
                              `Total unique events read: ${uniqueEventIdsRead.length}`
                            )

                            if (
                              uniqueEventIdsRead.length ===
                              expectedNumberOfReads
                            ) {
                              console.log(
                                `Consumer group ${groupName} on node has read the expected number of events: ${uniqueEventIdsRead.length}`
                              )
                              resolve()
                            }
                          }
                        }
                      }
                    )
                  }
                )()
              )
          )
        )
      )
    )
  }).timeout(15000)
})
