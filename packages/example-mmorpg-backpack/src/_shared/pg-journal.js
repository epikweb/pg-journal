const { Pool } = require('pg')
const { EventStore, ProjectionStore } = require('../../../../src')

const eventStorePool = new Pool({
  pool: process.env.EVENT_STORE_URL,
})
const projectionPool = new Pool({
  pool: process.env.PROJECTION_STORE_URL,
})

const eventStore = EventStore({ pool: eventStorePool })
const projectionStore = ProjectionStore({ pool: projectionPool })

module.exports = {
  eventStore,
  projectionStore,
}
