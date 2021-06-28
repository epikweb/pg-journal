module.exports = {
  installPostgresProjector: require('./src/install').install,
  uninstallPostgresProjector: require('./src/uninstall').uninstall,
  PostgresProjector: require('./src/store').PostgresProjector,
}
