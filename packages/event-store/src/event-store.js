module.exports.EventStore = ({ client }) => ({
  ...require('./appendToStream')({ client }),
  ...require('./readStreamForwards')({ client }),
  ...require('./streamFromAll')({ client }),
  ...require('./createPersistentSubscription')({ client }),
  ...require('./connectToPersistentSubscription')({ client }),
})
