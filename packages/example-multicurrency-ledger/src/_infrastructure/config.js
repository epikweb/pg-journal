require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '..', '.env.test'),
})

module.exports = {
  eventStoreConnectionString: process.env.EVENT_STORE_CONNECTION_STRING,
  postgresProjectorConnectionString:
    process.env.POSTGRES_PROJECTOR_CONNECTION_STRING,
}
