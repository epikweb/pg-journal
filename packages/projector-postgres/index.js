module.exports = {
  install: require('./src/install').install,
  uninstall: require('./src/uninstall').uninstall,
  PostgresProjector: require('./src/store').PostgresProjector,
}
