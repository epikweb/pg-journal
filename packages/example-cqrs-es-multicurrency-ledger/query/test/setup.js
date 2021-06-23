const eventStore = require('../../../event-store')
const postgresReadModelStore = require('../../../projector-postgres')
const { ddlClient, client, schemaName } = require('./config')

;(() =>
  ddlClient
    .dropDatabase()
    .then(ddlClient.createDatabase)
    .then(() => eventStore.install({ client, schemaName }))
    .then(() => postgresReadModelStore.install({ client, schemaName }))
    .then(() =>
      Promise.all([
        // eslint-disable-next-line global-require
        require('../src/2021-06-22-initial-migration').up({ client }),
      ])
    ))()
