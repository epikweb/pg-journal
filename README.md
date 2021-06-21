# 🐘 pg-journal

**pg-journal** is a framework agnostic Event Store for PostgreSQL inspired by the works of Akka and multiple experimental event store attempts in [Immutable Stack](https://github.com/StevePavlin/immutable-stack).

## Library/Documentation Goals

- ✅ Global position streaming/checkpointing for read models
- ✅ Gap detection for projections
- ✅ Opinionated projections/checkpointing
- ✅ Opinionated write retry policy
- ✅ Real life example apps
- ✅ Competing consumers pattern for external consumer with implementations for AWS Kinesis/Redis
- ✅ Support for table partitioning for faster btree rebuilds
- ✅ Archiving to AWS S3 of old partitions
- ✅ Seamless replication between clusters for blue-green deployments
- ✅ Automated performance testing at scale on bigger EC2/RDS instances at scale (1B+ rows)
- ✅ Guides on how to deal with every type of schema change that will happen in production and how it relates to standard state-based persistence
- ✅ Flexibility of synchronous projections (same ACID transaction) or asynchronous
- ✅ 100% test coverage


## Installation

```
$ yarn add pg-journal
```

## Basic Usage

```
WIP
```

## Contributing

Pull requests are welcome 😃

Steps to run the test suite:

- Create a local cluster (optional) - `docker-compose up`
- Enter the following line in .env with the cluster credentials you're testing against:
```
DATABASE_URL=postgres://user:password@localhost:6337/pg_journal_test
```
- Drop, create and run schema DDL - `yarn db:setup`
- Run tests - `yarn test`



## Credits

- [Immutable Stack](https://github.com/StevePavlin/immutable-stack)
- [Akka Persistence Postgres](https://github.com/SwissBorg/akka-persistence-postgres)
- [Event Sourcing - Why using a message broker is a bad idea](https://diogojoma.medium.com/event-sourcing-why-using-a-message-broker-is-a-bad-idea-ddc11089c876)
- [EventStoreDB C# API](https://developers.eventstore.com/clients/dotnet/5.0/streams/)
- [Versioning in an event sourced system](https://leanpub.com/esversioning/read)
- [Axon Casino](https://github.com/nklmish/axon-casino)
- [CQRS and Event Sourcing with Spring & Axon](https://www.youtube.com/watch?v=hkJ29ER1EZU)
- [SQL Event Store, maybe not](https://nordfjord.io/blog/sql-event-store-maybe-not)