# ⚡ Boost
[![license](https://img.shields.io/static/v1?label=license&message=apache%202&color=green)](/LICENSE)
![beta](https://img.shields.io/static/v1?label=status&message=in%20development&color=blueviolet)



**⚡ Boost** is a platform to build reactive event driven Node apps heavily inspired by:
- [Axon](https://github.com/AxonFramework/AxonFramework)
- [Xoom](https://docs.vlingo.io/xoom-actors)
- [EventStoreDB](https://github.com/EventStore/EventStore)
- [Nact](https://github.com/nactio/nact)
- [Akka](https://github.com/akka/akka)

The goal of the framework is to:
- Solve the code maintenance problems introduced by **shared mutable state** through the use of **Message Passing** and **Location Transparency** 
- Rely completely on [🐘 **PostgreSQL**](https://www.postgresql.org/) for the entire OLTP/messaging stack to reduce operational complexity
- Provide a composable set of packages **without lock-in** that can be used to [**selectively**](https://www.infoq.com/news/2016/04/event-sourcing-anti-pattern/) apply CQRS/Event Sourcing in real world apps where its needed
- Implement reliable 🎭 **Actor** clustering
- Provide non-CRUD examples of modeling real world complex domains 

# 🏷 Features
- ✅ Event store
- ✅ Guaranteed global ordering for read models (projections)
- ✅ Opinionated projectors for common data stores
- ✅ **Real world** example [apps](/packages/example-multicurrency-ledger)
- ✅ Performance tests & [reports](/packages/benchmarks)

# ✨ Live Demo
TODO deploy MMORPG backpack front/backend to heroku

# 🗺️ Roadmap
- 📌 Competing consumers for reliable IPC/parallel event processing similar to [EventStoreDB Persistent Subscriptions](https://developers.eventstore.com/clients/dotnet/5.0/subscriptions/persistent-subscriptions.html) and [Axon Tracking Event Processors](https://axoniq.io/blog-overview/tracking-event-processors)
- 📌 Benchmark up to 20k transactions/sec (50/50 read/write) on 8 core EC2 instance
- 📌 Consumer driven contract testing (with [Avro](https://docs.confluent.io/platform/current/schema-registry/index.html))
- 📌 Redis projector
- 📌 Basic actor implementation
- 📌 Support journal partitioning to solve increasing btree index rebuild times
- 📌 Clustered actor implementation
- 📌 Kafka sink for more scalable competing consumer subscriptions



# ✍ Documentation
TODO publish to npm & setup conventional commits
TODO link to github pages


# 🧪 Contributing
Pull requests/maintainers are welcome! 😃 
- Tests should be green
- Linting should pass

Install dev dependencies & run tests in a specific package:
```
$ yarn
$ yarn workspace fact-pg-journal test
```

# 💡 License
This project is licensed under the terms of the [Apache 2.0 license](/LICENSE).
