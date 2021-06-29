const enabled = true
module.exports.log = {
  info: (...args) => enabled && console.info(...args),
  debug: (...args) => enabled && console.log(`[Debug]:`, ...args),
  error: (...args) => enabled && console.error(`[Error]`, ...args),
}
