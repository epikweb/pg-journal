const { log } = require('./logging')

module.exports.uninstall = async ({ client }) => {
  const start = Date.now()
  await client.query(`
      create table public.pg_journal_projection_state
      (
          checkpoint    bigserial  not null,
          name       varchar(255) not null unique
      );
    
  `)
  log.debug(`Schema added +${Date.now() - start}ms`)
}
