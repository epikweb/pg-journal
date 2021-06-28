const { installPostgresProjector } = require('@pg-journal/postgres-projector')
const { installEventStore } = require('@pg-journal/event-store')
const {
  eventStoreClient,
  postgresProjectorClient,
} = require('../src/_infrastructure')

;(() =>
  Promise.all([
    eventStoreClient.dropDatabase(),
    postgresProjectorClient.dropDatabase(),
  ])
    .then(() =>
      Promise.all([
        eventStoreClient.createDatabase(),
        postgresProjectorClient.createDatabase(),
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
      Promise.all([postgresProjectorClient.close(), eventStoreClient.close()])
    ))()
