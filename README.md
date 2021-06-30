# 📔 Fact
[![license](https://img.shields.io/static/v1?label=license&message=apache%202&color=green)](/LICENSE)
![beta](https://img.shields.io/static/v1?label=status&message=in%20development&color=blueviolet)



**Fact** is a framework to build reactive event driven Node.js apps heavily inspired by [EventStoreDB](https://github.com/EventStore/EventStore), [Nact](https://github.com/nactio/nact), [Akka](https://github.com/akka/akka) and [Axon](https://github.com/AxonFramework/AxonFramework).

The goal of the framework is to:
 - Provide a composable set of libraries **without lock-in** that can be used to selectively apply CQRS/Event Sourcing in real world apps where its needed
 - Rely heavily on [🐘 PostgreSQL](https://www.postgresql.org/) for the entire OLTP stack to reduce operational complexity


# 🏷 Features
- ✅ Postgres event store
- ✅ Postgres projector
- ✅ **Real world** example [app](/packages/example-multicurrency-ledger)
- ✅ Performance benchmarks

# 🗺️ Roadmap
- 📌 Competing consumers for reliable IPC similar to [EventStoreDB](https://developers.eventstore.com/clients/dotnet/5.0/subscriptions/persistent-subscriptions.html)
- 📌 Benchmark up to 20k transactions/sec (50/50 read/write) on 8 core EC2 instance
- 📌 Consumer driven contract testing (with [Avro](https://docs.confluent.io/platform/current/schema-registry/index.html))
- 📌 Redis projector
- 📌 Basic actor implementation
- 📌 Support event store table partitioning to solve increasing BTREE index rebuild times
- 📌 Clustered actor implementation
- 📌 Kafka sink for competing consumer subscriptions


# ✨ Live Demo
TODO deploy simple front/backend to heroku

# ✍ Documentation
TODO publish to npm & setup conventional commits
TODO link to github pages


# 🧪 Contributing
Pull requests/maintainers are welcome! 😃 
- Tests should be passing
- Linting should pass

Install dev dependencies & run tests in a specific package:
```
$ yarn
$ yarn workspace fact-pg-journal test
```

# 💡 License
This project is licensed under the terms of the [Apache 2.0 license](/LICENSE).
