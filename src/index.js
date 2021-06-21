/* eslint-disable */

const { Pool } = require('pg')

module.exports.EventStore = ({ connectionString, pool }) => {
  const definedPool = pool
    ? pool
    : new Pool({
        connectionString,
      })

  return {
    ...require('./appendToStream')({ pool: definedPool }),
    ...require('./readStreamForwards')({ pool: definedPool }),
  }
}

module.exports.ProjectionStore = ({
  eventStoreConnection = { connectionString, pool },
  projectionStoreConnection = { connectionString, pool },
}) => {
  const eventStorePool = eventStoreConnection.pool
    ? eventStoreConnection.pool
    : new Pool({
        connectionString: eventStoreConnection.connectionString,
      })
  const projectionStorePool = projectionStoreConnection.pool
    ? projectionStoreConnection.pool
    : new Pool({
        connectionString: projectionStoreConnection.connectionString,
      })

  return {
    ...require('./streamFromAll')({ eventStorePool, projectionStorePool }),
  }
}
