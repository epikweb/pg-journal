const { outstandingBalancesDao } = require('./2-outstanding-balances-dao')

module.exports.getOutstandingBalances = () => outstandingBalancesDao.find()
