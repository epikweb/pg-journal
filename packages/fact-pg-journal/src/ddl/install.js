const { log } = require('../logging')

module.exports.install = async ({ client }) => {
  const start = Date.now()
  await client.query(`
      create table if not exists public.pg_journal_events
      (
          global_index bigserial,
          sequence_number bigint not null,
          stream_id  varchar(255) not null,
          event_type varchar(255) not null,
          event_payload jsonb not null,
          timestamp timestamptz not null default now(),
          primary key (stream_id, sequence_number)
      );
      create index journal_global_idx on public.pg_journal_events using brin(global_index);

      create table if not exists public.pg_journal_system_events
      (
          global_index bigserial,
          sequence_number bigint not null,
          stream_id  varchar(255) not null,
          event_type varchar(255) not null,
          event_payload jsonb not null,
          timestamp timestamptz not null default now(),
          primary key (stream_id, sequence_number)
      );
      create index system_journal_global_idx on public.pg_journal_system_events using brin(global_index);


      create table if not exists public.pg_journal_snapshots
      (
          stream_id  varchar(255)   not null,
          sequence_number bigint not null,
          state        jsonb  not null,
          timestamp timestamptz not null default now(),
          primary key (stream_id, sequence_number)
      );

      create table if not exists public.pg_journal_consumer_groups
      (
          id  bigserial,
          stream_id  varchar(255)   not null,
          consumer_group_name  varchar(255)   not null,
          checkpoint    bigint not null,
          leader_node_id varchar(255) not null,
          last_leader_lease_renewal timestamptz not null default now(),
          primary key (stream_id, consumer_group_name)
      );
      create table if not exists public.pg_journal_consumer_group_nodes
      (
          id  bigserial unique primary key,
          consumer_group_id bigint,
          node_id  varchar(255) not null,
          min_checkpoint    bigint not null,
          max_checkpoint    bigint not null,
          last_lease_renewal timestamptz not null default now()
      );

`)

  log.debug(`Installed +${Date.now() - start}ms`)
}
