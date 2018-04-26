const http = require('http')
const httpProxy = require('http-proxy')
const { info, warn, error } = require('./logger')

class ProxyServer {
  constructor(port, getBaseEndpointForUrl) {
    const proxy = this.createProxy()
    this.createServer(proxy, port, getBaseEndpointForUrl)
    info(`Proxy Server is Listing to port ${port}`)
  }

  createProxy() {
    const proxy = httpProxy.createProxyServer({ changeOrigin: true })

    proxy.on('error', function(err, req, res) {
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      })
      console.error(
        `error: The proxy failed for the previous request. Details '${err}'`
      )
      res.end(`Error with the proxy ${err}`)
    })
    return proxy
  }

  createServer(proxy, port, getBaseEndpointForUrl) {
    const server = http.createServer((req, res) => {
      const baseUrl = getBaseEndpointForUrl(req.url)
      if(handleCors(req, res)) return
      const redirectMessage = `The base url for: ${req.url} is ${baseUrl.url}`
      if (baseUrl.blockNotFound) {
        warn(`Block not found in the definition file! ${redirectMessage}`)
      } else {
        warn(redirectMessage)
      }
      proxy.web(req, res, { target: baseUrl.url })
    })
    server.listen(port)
    return server
  }
}

function handleCors(req, res) {
  let allowedOrigin = false
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader(
      'Access-Control-Allow-Methods',
      'POST, GET, OPTIONS, DELETE, PUT'
    )
    allowedOrigin = true
  }

  if (req.headers['Access-Control-Request-Method']) {
    res.setHeader(
      'Access-Control-Request-Method',
      req.headers['Access-Control-Request-Method']
    )
  }

  if (req.headers['Access-Control-Request-Headers']) {
    res.setHeader(
      'Access-Control-Request-Headers',
      req.headers['Access-Control-Request-Headers']
    )
  }

  if (allowedOrigin) {
    res.setHeader('Access-Control-Max-Age', 60 * 60 * 24 * 30)
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return true
    }
  }
}
module.exports = ProxyServer
