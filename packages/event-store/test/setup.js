const { install } = require('../src/install')
const { ddlClient, client, schemaName } = require('./config')

;(() =>
  ddlClient
    .dropDatabase()
    .then(ddlClient.createDatabase)
    .then(() => client.query(`CREATE SCHEMA ${schemaName}`))
    .then(() => install({ client, schemaName }))
    .then(() => Promise.all([ddlClient.close(), client.close()])))()
