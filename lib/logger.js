const log = (message, type) => {
  if (type === 'error') {
    return console.error(`\nerror: ${message}\n`)
  }
  if (type === 'info') {
    return console.info(`\ninfo: ${message}\n`)
  }
  if (type === 'log') {
    return console.log(`\nlog: ${message}\n`)
  }
  if (type === 'warn') {
    return console.warn(`\nwarn: ${message}\n`)
  }
  if (type === 'raw') {
    return console.log(`\n${message}\n`)
  }
  throw new Error('Unkown log type')
}

exports.error = m => log(m, 'error')
exports.log = m => log(m, 'log')
exports.info = m => log(m, 'info')
exports.warn = m => log(m, 'warn')
exports.raw = m => log(m, 'raw')
