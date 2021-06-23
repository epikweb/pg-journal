const { log } = require('./logging')

module.exports.install = async ({ client }) => {
  const start = Date.now()
  await client.query(`
      create table pg_journal_projection_state
      (
          checkpoint    bigserial  not null,
          name       varchar(255) not null unique
      );
  `)
  await client.end()
  log.debug(`Schema added +${Date.now() - start}ms`)
}
