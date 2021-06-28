const { constructClient } = require('./harness')

const client = constructClient()

;(() =>
  client
    .dropDatabase()
    .then(client.createDatabase)
    .then(() =>
      client.query(`
        create table orders(
            id bigserial not null primary key
        );
        create table items(
            id bigserial not null primary key,
            name varchar(255) not null,
            price decimal(10, 2) not null
        );
        create table order_line_items(
            order_id bigint not null references orders(id),
            item_id bigint not null references items(id),
                                    
            primary key(order_id, item_id)
        );
    `)
    )
    .then(client.close))()
