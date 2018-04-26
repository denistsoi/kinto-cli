const http = require('http')
const url = require('url')
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
    proxy.on('proxyRes', (proxyRes, req, res) => {
      let allowedOrigin = false
      if (req.headers.origin) {
        const originHostName = url.parse(req.headers.origin).hostname
        if (originHostName && allowedOrigins.some(o => o === originHostName)) {
          res.setHeader('access-control-allow-origin', req.headers.origin)
          res.setHeader('access-control-allow-credentials', 'true')
          allowedOrigin = true
        }
      }

      if (req.headers['access-control-request-method']) {
        res.setHeader(
          'access-control-allow-methods',
          req.headers['access-control-request-method']
        )
      }

      if (req.headers['access-control-request-headers']) {
        res.setHeader(
          'access-control-allow-headers',
          req.headers['access-control-request-headers']
        )
      }

      if (allowedOrigin) {
        res.setHeader('access-control-max-age', 60 * 60 * 24 * 30)
        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
        }
      }
    })

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

module.exports = ProxyServer
