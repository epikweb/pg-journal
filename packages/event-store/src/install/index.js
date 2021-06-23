const { log } = require('../logging')

module.exports.install = async ({ client }) => {
  const start = Date.now()
  await client.query(`
      CREATE TABLE IF NOT EXISTS public.pg_journal_events
      (
          global_index BIGSERIAL,
          sequence_number BIGINT NOT NULL,
          aggregate_id  TEXT NOT NULL,
          event_type TEXT NOT NULL,
          event_payload JSONB NOT NULL,
          tags int[],
          timestamp timestamptz NOT NULL,
          PRIMARY KEY (aggregate_id, sequence_number)
      );

      CREATE EXTENSION IF NOT EXISTS intarray WITH SCHEMA public;
      CREATE INDEX journal_tags_idx ON public.pg_journal_events USING GIN (tags public.gin__int_ops);
      CREATE INDEX journal_global_idx ON public.pg_journal_events USING BRIN (global_index);

      CREATE TABLE IF NOT EXISTS public.pg_journal_tags
      (
          id              BIGSERIAL,
          name            TEXT                        NOT NULL,
          PRIMARY KEY (id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS tags_name_idx on public.pg_journal_tags (name);

      CREATE TABLE IF NOT EXISTS public.pg_journal_snapshots
      (
          aggregate_id  TEXT   NOT NULL,
          sequence_number BIGINT NOT NULL,
          timestamp      timestamptz NOT NULL,
          payload        jsonb  NOT NULL,
          metadata        jsonb  NOT NULL,
          PRIMARY KEY (aggregate_id, sequence_number)
      );
  `)
  log.debug(`Installed +${Date.now() - start}ms`)
}
