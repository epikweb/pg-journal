module.exports.log = {
  debug: (...args) => console.log(`[Debug]:`, ...args),
  error: (...args) => console.error(`[Error]`, ...args),
}
