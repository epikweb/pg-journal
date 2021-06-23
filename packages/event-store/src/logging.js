module.exports.log = {
  info: (...args) => console.info(...args),
  debug: (...args) => console.log(`[Debug]:`, ...args),
  error: (...args) => console.error(`[Error]`, ...args),
}
