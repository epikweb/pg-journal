module.exports = {
  installEventStore: require('./src/install').install,
  uninstallEventStore: require('./src/uninstall').uninstall,
  EventStore: require('./src/event-store').EventStore,
  ExpectedVersion: require('./src/constants').ExpectedVersion,
  StreamPosition: require('./src/constants').StreamPosition,
}
