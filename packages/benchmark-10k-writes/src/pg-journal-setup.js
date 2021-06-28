const { installEventStore } = require('@pg-journal/event-store')
const { eventStoreClient } = require('./pg-journal-harness')

;(() =>
  eventStoreClient
    .dropDatabase()
    .then(eventStoreClient.createDatabase)
    .then(() => installEventStore({ client: eventStoreClient }))
    .then(eventStoreClient.close))()
