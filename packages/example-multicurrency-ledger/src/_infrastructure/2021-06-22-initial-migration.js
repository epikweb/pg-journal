module.exports.up = ({ client }) =>
  client.query(`
      create table ledgers
      (
          currency varchar(255)   not null primary key,
          balance  numeric(10, 2) not null
      )
  `)

module.exports.down = ({ client }) =>
  client.query(`
      drop table if exists ledgers
  `)
