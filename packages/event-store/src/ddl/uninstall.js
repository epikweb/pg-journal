const { log } = require('../logging')

module.exports.uninstall = async ({ client }) => {
  const start = Date.now()
  await client.query(`
      DROP TABLE IF EXISTS public.pg_journal_events;
      DROP TABLE IF EXISTS public.pg_journal_tags;
      DROP TABLE IF EXISTS public.pg_journal_snapshots;

      DROP EXTENSION IF EXISTS intarray;
      DROP INDEX IF EXISTS journal_tags_idx;
      DROP INDEX IF EXISTS journal_global_idx;
  `)
  log.debug(`Uninstalled +${Date.now() - start}ms`)
}
