const { outstandingBalancesDao } = require('./dao')

module.exports.getOutstandingBalances = () => outstandingBalancesDao.find()
