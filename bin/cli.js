const { runDatabaseSchema } = require('../sql/schema')
const { dropDatabase } = require('../sql/drop')
const { createDatabase } = require('../sql/create')

;(() => {
  switch (process.argv[2]) {
    case 'create':
      return createDatabase()
    case 'drop':
      return dropDatabase()
    case 'schema':
      return runDatabaseSchema()
    default:
      return null
  }
})()
