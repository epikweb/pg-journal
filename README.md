# 🐘 pg-journal
[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/StevePavlin/pg-journal/blob/master/LICENSE)


**pg-journal** is an open source CQRS/Event Sourcing library for Node.js/PostgreSQL inspired by the works of Akka and multiple experimental event store attempts in [Immutable Stack](https://github.com/StevePavlin/immutable-stack).

The goal of the library is to:
 - Provide a reusable set of functionality without lock-in that can be used to selectively apply CQRS/Event Sourcing in real world apps where its needed.
 

# 🏷 Features

- ✅ **Real world** example apps
- ✅ Projections with **exactly once** processing when using opinionated transactions
- ✅ Opinionated write retry policy
- ✅ Opinionated projection library for Postgres to ensure exactly once processing
- ✅ Gapless global ordering **without exclusive table locks** on the event journal
- ✅ Benchmarks against EventStoreDb
- ✅ 100% test coverage

# ✨ Live Demo

- TODO deploy one of the example apps to Heroku or AWS with a simple user interface

# 🙏🏻 Road map
- 🔯 Persistent subscriptions with the [competing consumers](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CompetingConsumers.html) pattern with postgres native, no dependencies)
- 🔯 Persistent subscriptions with the [competing consumers](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CompetingConsumers.html) pattern with kafka
- 🔯 Opinionated redis projection library
- 🔯 Support for table partitioning for [faster btree rebuilds](https://axoniq.io/blog-overview/eventstore)
- 🔯 Archiving to AWS S3 of old partitions
- 🔯 Delayed commands with at least once delivery ([deadlines](https://docs.axoniq.io/reference-guide/v/3.3/part-ii-domain-logic/deadlines)) 
- 🔯 Seamless replication between clusters for blue-green deployments



# 🖥 Installation

```
$ yarn add @pg-journal/event-store
$ yarn add @pg-journal/projection-plugin-postgres
```

# ✍ Basic Usage

- **pg-journal** requires an instance of [pg](https://github.com/brianc/node-postgres) in its constructor.
- `ProjectionStore` is an opinionated projection API for postgres checkpointing if you decide to use postgres for one of your read models.

```js
TODO
```

# 🧪 Contributing

Pull requests are welcome 😃 Tests/linting rules should pass to be merged into mainline.

- Bootstrap dev dependencies in root - `npx lerna bootstrap`
- Bootstrap infrastructure, databases and schemas in a package - `yarn test:setup`
- Run test - `yarn test`


#### Test suites
- Unit tests are using within each packages functional core to test inputs/outputs
- Integration tests are using within each packages boundary to test its database contract
- System tests are using in the `examples` folder to test integration between multiple package versions so atomic changes can be made


# License

This project is licensed under the terms of the [MIT license](/LICENSE).