const {
  postgresProjectorDdlClient,
} = require('../src/_infrastructure/postgres-projector-ddl')
const {
  eventStoreDdlClient,
} = require('../src/_infrastructure/event-store-ddl')
const {
  postgresProjectorClient,
} = require('../src/_infrastructure/postgres-projector')
const { eventStoreClient } = require('../src/_infrastructure/event-store')
const installEventStore = require('@pg-journal/event-store').install
const installPostgresProjector =
  require('@pg-journal/postgres-projector').install

;(() =>
  Promise.all([
    eventStoreDdlClient.dropDatabase(),
    postgresProjectorDdlClient.dropDatabase(),
  ])
    .then(() =>
      Promise.all([
        eventStoreDdlClient.createDatabase(),
        postgresProjectorDdlClient.createDatabase(),
      ])
    )
    .then(() =>
      Promise.all([
        installEventStore({ client: eventStoreClient }),
        installPostgresProjector({
          client: postgresProjectorClient,
        }),
      ])
    )
    .then(() =>
      Promise.all([
        require('../src/_infrastructure/2021-06-22-initial-migration').up({
          client: postgresProjectorClient,
        }),
      ])
    )
    .then(() =>
      Promise.all([
        postgresProjectorClient.close(),
        postgresProjectorDdlClient.close(),
        eventStoreClient.close(),
        eventStoreDdlClient.close(),
      ])
    ))()
