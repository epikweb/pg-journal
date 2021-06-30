module.exports = {
  installEventStore: require('./src/ddl/install').install,
  uninstallEventStore: require('./src/ddl/uninstall').uninstall,
  EventStore: require('./src/event-store').EventStore,
  ExpectedVersion: require('./src/constants').ExpectedVersion,
  StreamPosition: require('./src/constants').StreamPosition,
}
