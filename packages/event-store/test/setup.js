const { installEventStore } = require('../index')
const { client } = require('./harness')

;(() =>
  client
    .dropDatabase()
    .then(client.createDatabase)
    .then(() => installEventStore({ client }))
    .then(client.close))()
