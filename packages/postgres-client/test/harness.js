const { client } = require('./config')

module.exports = {
  cleanTables: () =>
    client.query(`
      truncate table order_line_items restart identity;
      truncate table orders restart identity;
      truncate table items restart identity;
    `),
}
