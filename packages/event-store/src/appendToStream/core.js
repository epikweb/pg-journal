const { assert } = require('chai')
const { ExpectedVersion } = require('../constants')
const { pipe } = require('../auxiliary')

const checkPreconditions = ({ aggregateId, expectedVersion, events }) => {
  assert.typeOf(aggregateId, 'string')
  assert.typeOf(expectedVersion, 'number')
  assert.isAtLeast(expectedVersion, ExpectedVersion.NoStream)
  assert.isArray(events)
  assert(
    events.filter(
      ({ type, payload }) =>
        typeof type === 'string' && typeof payload === 'object'
    ).length === events.length
  )
}

const PostgresUniqueConstraintErrorCode = '23505'
const handleError = ({ err, attemptsMade, random = Math.random() }) => {
  if (err.code === PostgresUniqueConstraintErrorCode) {
    if (attemptsMade === 10) {
      return {
        instruction: 'throw',
        data: { msg: `Concurrency violation after ${attemptsMade} attempts` },
      }
    }

    const backoffDelay = 2 ** attemptsMade * random
    return {
      instruction: 'sleepThenRetry',
      data: { nextAttempt: attemptsMade + 1, backoffDelay },
    }
  }

  return { instruction: 'throw', data: { msg: err.name } }
}

const sequenceEvents = ({ events, expectedVersion, attemptsMade }) =>
  events.map((event, index) => ({
    ...event,
    sequenceNumber: expectedVersion + attemptsMade + index,
  }))

const prepareInsertSql = ({
  aggregateId,
  schemaName,
  events,
  expectedVersion,
  attemptsMade,
  now,
}) =>
  pipe(
    () => sequenceEvents({ events, expectedVersion, attemptsMade }),
    (sequencedEvents) =>
      sequencedEvents.reduce(
        (rows, event) => [
          ...rows,
          `('${aggregateId}', 
          ${event.sequenceNumber}, 
           '${event.type}', 
          '${JSON.stringify(event.payload)}',
          '${new Date(now).toISOString()}')`,
        ],
        []
      ),
    (insertStrings) =>
      `
                      insert into ${schemaName}.pg_journal_events
                      (aggregate_id, sequence_number, event_type, event_payload, timestamp)
                      values ${insertStrings}
    `
  )()

module.exports = {
  checkPreconditions,
  handleError,
  prepareInsertSql,
}
