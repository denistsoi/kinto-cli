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
      console.error(`error: The proxy failed for the previous request. Details '${err}'`)
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
