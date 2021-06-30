module.exports.getStorageTable = (isSystemStream) =>
  isSystemStream ? 'pg_journal_system_events' : 'pg_journal_events'
