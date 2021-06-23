module.exports = {
  install: require('./src/install').install,
  uninstall: require('./src/uninstall').uninstall,
  EventStore: require('./src/event-store').EventStore,
  ExpectedVersion: require('./src/constants').ExpectedVersion,
}
