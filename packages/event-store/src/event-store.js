module.exports.EventStore = ({ client }) => ({
  ...require('./appendToStream')({ client }),
  ...require('./readStreamForwards')({ client }),
  ...require('./streamFromAll')({ client }),
})
