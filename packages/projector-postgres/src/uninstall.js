const { log } = require('./logging')

module.exports.uninstall = async ({ client }) => {
  const start = Date.now()
  await client.query(`
      drop table if exists public.pg_journal_projection_state;
  `)
  log.debug(`Uninstalled +${Date.now() - start}ms`)
}
