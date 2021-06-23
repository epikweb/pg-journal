const eventStore = require('../../event-store')
const { ddlClient, client, schemaName } = require('./config')

;(() =>
  ddlClient
    .dropDatabase()
    .then(ddlClient.createDatabase)
    .then(() => eventStore.install({ client, schemaName })))()
