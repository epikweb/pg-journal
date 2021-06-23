const {
  runDatabaseSchema,
} = require('../../../../event-store-cli/runDatabaseSchema')

module.exports.up = async (client) => {
  await runDatabaseSchema()
  await client.query(`
      create table player_backpacks
      (
          player_id uuid not null primary key,
          items jsonb not null
      );

      create table top_items_in_backpacks
      (
          name varchar(255) not null primary key,
          count bigint not null
      );

      create table items
      (
          name varchar(255) not null primary key,
          enabled boolean not null
      );
  `)
}
