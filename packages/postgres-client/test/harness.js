require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '..', '.env.10k-writes'),
})

const { PostgresClient } = require('..')

const connectionString = process.env.CONNECTION_STRING
module.exports = {
  constructClient: (options = {}) =>
    PostgresClient({
      connectionString,
      ...options,
      loggingEnabled: false,
    }),
  cleanTables: (client) =>
    client.query(`
      delete from order_line_items;
      delete from orders;
      delete from items;

      select setval('orders_id_seq', 1, false);
      select setval('items_id_seq', 1, false);
    `),
  seedTables: (client) =>
    client.query(`
        insert into items(id, name, price) values(default, 'Sword', 5.0);
        insert into items(id, name, price) values(default, 'Shield', 25.0);

        insert into orders(id) values(default);

        insert into order_line_items(order_id, item_id) values(1, 1);
        insert into order_line_items(order_id, item_id) values(1, 2);
    `),
}
