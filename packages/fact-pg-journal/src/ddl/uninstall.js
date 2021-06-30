const { log } = require('../logging')

module.exports.uninstall = async ({ client }) => {
  const start = Date.now()
  await client.query(`
      drop table if exists public.pg_journal_events;
      drop table if exists public.pg_journal_snapshots;
      drop table if exists public.pg_journal_system_events;
  `)
  log.debug(`Uninstalled +${Date.now() - start}ms`)
}
