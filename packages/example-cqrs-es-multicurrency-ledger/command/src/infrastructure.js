require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '..', '..', '.env.test'),
})

const { EventStore } = require('../../../event-store')

const connectionString = process.env.EVENT_STORE_DATABASE_URL
const eventStore = EventStore({
  connectionString,
})

module.exports = {
  eventStore,
}
