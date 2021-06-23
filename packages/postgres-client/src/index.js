module.exports = {
  // eslint-disable-next-line global-require
  PostgresClient: require('./regular-client'),
  // eslint-disable-next-line global-require
  PostgresDdlClient: require('./ddl-client'),
}
