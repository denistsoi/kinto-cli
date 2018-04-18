const util = require('util')
const exec = util.promisify(require('child_process').exec)

exports.isDockerRunning = async () => {
  try {
    await exec('docker ps')
    return true
  } catch (e) {
    return false
  }
}

exports.getDockerCommand = endpointsBase64 => {
  return `docker run -e KINTO_CONFIG=${endpointsBase64} kintocloud.azurecr.io/gateway-middleware:local-proxy-v1`
}

exports.runLocalMiddleware = async (endpointsBase64) => {
  await exec(exports.getDockerCommand(endpointsBase64))
}
