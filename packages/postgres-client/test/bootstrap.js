require('dotenv').config({
  // eslint-disable-next-line global-require
  path: require('path').join(__dirname, '.env.test'),
})

const { PostgresClient } = require('..')
const { spawn } = require('child_process')
const waitOn = require('wait-on')

const runCommand = (cmd, args, env) => {
  console.log(`Running shell cmd`, cmd, args)
  const ls = spawn(cmd, args, {
    env: {
      ...process.env,
      ...env,
    },
    cwd: __dirname,
  })

  return new Promise((resolve, reject) => {
    ls.stdout.on('data', (data) => {
      console.log(`stdout: ${data.toString()}`)
    })

    ls.stderr.on('data', (data) => {
      console.log(`stderr: ${data.toString()}`)
      if (data.toString().includes('No such container')) {
        resolve()
      }
    })

    ls.on('exit', (code) => {
      console.log(`child process exited with code ${code.toString()}`)
      if (code === 0) {
        resolve()
      }
    })
  })
}

module.exports.arrangeSut = () =>
  runCommand('docker-compose', ['up', '-d']).then(() => {
    const client = PostgresClient({
      connectionString: process.env.CONNECTION_STRING,
      poolSize: 5,
      loggingEnabled: false,
    })
    return client
      .query(
        `
        drop table order_line_items;
        drop table orders;
        drop table items;

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

        insert into items(id, name, price) values(default, 'Sword', 5.0);
        insert into items(id, name, price) values(default, 'Shield', 25.0);

        insert into orders(id) values(default);

        insert into order_line_items(order_id, item_id) values(1, 1);
        insert into order_line_items(order_id, item_id) values(1, 2);
    `
      )
      .then(() => client)
  })
