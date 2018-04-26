const fs = require('fs')
const Configstore = require('configstore')
const { info, error, log, raw } = require('./logger')
const {
  isDockerRunning,
  runLocalMiddleware,
  getDockerCommand,
  runKubectlProxies,
  getEndpointForEnv
} = require('./utils')
const ProxyServer = require('./ProxyServer')
const EndpointsDefinition = require('./EndpointsDefinition')

const pkg = require('../package.json')
const conf = new Configstore(pkg.name)

exports.viewConfig = () => {
  raw(
    JSON.stringify(
      {
        env: conf.get('env')
      },
      null,
      4
    )
  )
}

exports.updateConfig = ({ env }) => {
  conf.set('env', env || 'prod')
}

exports.clearConfig = () => {
  conf.clear()
  info('cache successfully cleared')
}

exports.proxyRequest = async options => {
  const env = conf.get('env')
  if (!env) {
    return error("missing env, you must do 'kinto init' first")
  }
  const remoteEndpoint = getEndpointForEnv(env)

  if (!options.file) {
    return error('missing required flag --file')
  }
  const isDockerActive = await isDockerRunning()
  if (!isDockerActive) {
    return error('docker must be running')
  }

  let json = null
  if (options.file) {
    try {
      const text = fs.readFileSync(options.file, 'utf8')
      json = JSON.parse(text)
    } catch (e) {
      return error("couldn't read or parse file")
    }
  }

  info('Running Kubectl Proxies')
  runKubectlProxies(env)

  const port = options.port || 8000
  const endpointsDefinition = new EndpointsDefinition(
    json,
    options.block,
    remoteEndpoint
  )

  const base64 = endpointsDefinition.toBase64()
  info(`Running the follwoing: '${getDockerCommand(base64)}'`)

  new ProxyServer(port, endpointsDefinition.getBaseEndpointForUrl)
  runLocalMiddleware(base64)
}
