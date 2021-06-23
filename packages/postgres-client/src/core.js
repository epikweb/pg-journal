const { Pool } = require('pg')
const { parse } = require('pg-connection-string')

module.exports.instanceOfUs = (client) =>
  client && client.query && client.beginTransaction
module.exports.constructPool = ({
  username,
  password,
  host,
  port,
  database,
  connectionString,
  pgPool,
}) => {
  if (pgPool) {
    return pgPool
  }

  const parsedString = parse(connectionString)

  if (connectionString) {
    if (database && parsedString.database !== database) {
      return new Pool({
        ...parsedString,
        database,
      })
    }

    return new Pool(parsedString)
  }

  return new Pool({
    user: username,
    password,
    database,
    port,
    host,
  })
}
