# 🐘 pg-journal
[![license](https://img.shields.io/static/v1?label=license&message=apache%202&color=green)](/LICENSE)
![beta](https://img.shields.io/static/v1?label=status&message=proof-of-concept&color=blueviolet)


**🐘 pg-journal** is a Proof of Concept Application Layer Event Sourcing inspired by:
- [Axon](https://github.com/AxonFramework/AxonFramework)
- [Xoom](https://docs.vlingo.io/)
- [EventStoreDB](https://github.com/EventStore/EventStore)
- [Nact](https://github.com/nactio/nact)
- [Akka](https://github.com/akka/akka)

### The Goal:
- Rely completely on [🐘 **PostgreSQL**](https://www.postgresql.org/) for the entire OLTP/messaging stack to reduce operational complexity
- Provide a composable set of packages **without lock-in** that can be used to [**selectively**](https://www.infoq.com/news/2016/04/event-sourcing-anti-pattern/) apply CQRS/Event Sourcing in real world apps where its needed
- Provide non-CRUD examples of modeling real world complex domains 


# Update

I've decided to not spend further time developing this approach due to its high cost and complexity (event sourcing on the application layer). Cons discovered:

- Reinventing powerful SQL operation such as group by/joins on the application layer
- Slow read model rebuild times with a large dataset
- Versionining online read models becomes a huge problem

Approaches such as [Lambda Architecture](https://databricks.com/glossary/lambda-architecture) and [Kappa Architecture](https://eng.uber.com/kappa-architecture-data-stream-processing/) have been shown to be scalable to petabytes whereas this approach does not. The batch processing side can be implemented by reading Postgres disk files and running a large Spark cluster on it, and stream processing done using Kinesis + Spark Streams.

I will start another project investigating Lambda Architecture using Postgres (with CDC) for the entire stack with Spark + Kinesis.


# 🏷 Features
- ✅ Event store
- ✅ Guaranteed global ordering/gap handling for read models (projections)
- ✅ Opinionated projectors for postgres
- ✅ **Real world** example [apps](/packages/example-multicurrency-ledger)
- ✅ Performance tests & [reports](/packages/benchmarks)


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
