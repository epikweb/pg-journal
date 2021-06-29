module.exports.pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x)

module.exports.bytesToSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${Math.round(bytes / Math.pow(1024, i), 2)} ${sizes[i]}`
}

module.exports.sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration))
