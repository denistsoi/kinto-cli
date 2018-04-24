const fs = require('fs')
const Configstore = require('configstore')
const { info, error, log, raw } = require('./logger')
const {
  isDockerRunning,
  runLocalMiddleware,
  getDockerCommand,
  runKubectlProxies
} = require('./utils')
const ProxyServer = require('./ProxyServer')
const EndpointsDefinition = require('./EndpointsDefinition')

const pkg = require('../package.json')
const conf = new Configstore(pkg.name)

exports.viewConfig = () => {
  raw(
    JSON.stringify(
      {
        endpoint: conf.get('endpoint')
      },
      null,
      4
    )
  )
}

exports.updateConfig = ({ endpoint }) => {
  conf.set('endpoint', endpoint || 'http://api.kintohub.com')
}

exports.clearConfig = () => {
  conf.clear()
  info('cache successfully cleared')
}

exports.proxyRequest = async options => {
  const remoteEndpoint = conf.get('endpoint')
  if (!remoteEndpoint) {
    return error("missing base endpoint, you must do 'kinto init' first")
  }
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
  runKubectlProxies()

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
