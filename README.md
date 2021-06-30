# 📔 Fact Framework
[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/StevePavlin/pg-journal/blob/master/LICENSE)



**Fact** is an open source CQRS/Event Sourcing framework for Node.js heavily inspired by [EventStoreDB](https://eventstore.com), [Akka](https://github.com/SwissBorg/akka-persistence-postgres) and [Axon](https://axoniq.io/).

The goal of the framework is to:
 - Provide modular set of libraries without lock-in that can be used to selectively apply CQRS/Event Sourcing in real world apps where its needed.
 

# 🏷 Features
- ✅ Event store
- ✅ Opinionated projection libraries
- ✅ Write/streaming benchmarks
- ✅ **Real world** example demo apps

# ✨ Live Demo

WIP


# 🖥 Installation

```
TODO publish to npm after MVP complete
$ yarn add @pg-journal/event-store
$ yarn add @pg-journal/projection-plugin-postgres
```

# ✍ Documentation

TODO link to github pages

# 🧪 Contributing

Pull requests are welcome 😃 Tests/linting rules should pass to be merged into mainline.

- Bootstrap dev dependencies in root - `npx lerna bootstrap`
- Run tests in package (infrastructure is automatically bootstrapped internally) - `yarn test`


# License
This project is licensed under the terms of the [MIT license](/LICENSE).