const { ddlClient, client } = require('./config')

;(() =>
  ddlClient
    .dropDatabase()
    .then(ddlClient.createDatabase)
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

        insert into items(id, name, price) values(default, 'Sword', 12.5);
        insert into items(id, name, price) values(default, 'Shield', 25.0);

        insert into orders(id) values(default);

        insert into order_line_items(order_id, item_id) values(1, 1);
        insert into order_line_items(order_id, item_id) values(1, 2);
    `)
    )
    .then(() => Promise.all([ddlClient.close(), client.close()])))()
