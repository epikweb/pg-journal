// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config()

const { Client } = require('pg')
const { user, password, host, port, database } =
  require('pg-connection-string').parse(process.env.DATABASE_URL)

const { log } = require('../../src/logging')

const client = new Client({
  user,
  password,
  host,
  port,
  database,
})

module.exports.runDatabaseSchema = async () => {
  const start = Date.now()

  await client.connect()
  await client.query(`
      DROP TABLE IF EXISTS public.pg_journal_events;

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

      DROP TABLE IF EXISTS public.pg_journal_tags;

      CREATE TABLE IF NOT EXISTS public.pg_journal_tags
      (
          id              BIGSERIAL,
          name            TEXT                        NOT NULL,
          PRIMARY KEY (id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS tags_name_idx on public.pg_journal_tags (name);

      DROP TABLE IF EXISTS public.pg_journal_snapshots;

      CREATE TABLE IF NOT EXISTS public.pg_journal_snapshots
      (
          aggregate_id  TEXT   NOT NULL,
          sequence_number BIGINT NOT NULL,
          timestamp      timestamptz NOT NULL,
          payload        jsonb  NOT NULL,
          metadata        jsonb  NOT NULL,
          PRIMARY KEY (aggregate_id, sequence_number)
      );


      CREATE TABLE pg_journal_projections
      (
          checkpoint    BIGSERIAL  NOT NULL,
          name       VARCHAR(255) NOT NULL UNIQUE
      );
  `)
  await client.end()
  log.debug(
    `Database "${database}" - initial schema added +${Date.now() - start}ms`
  )
}
