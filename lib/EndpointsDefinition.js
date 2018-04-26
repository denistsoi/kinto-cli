const { warn, info } = require('./logger')

class EndpointsDefinition {
  constructor(json, blocks, remoteEndpoint) {
    this.json = this.process(json, blocks)
    this.remoteEndpoint = remoteEndpoint
    this.getBaseEndpointForUrl = this.getBaseEndpointForUrl.bind(this)
  }

  process(endpointsFile, blocks) {
    return blocks.reduce((json, block) => {
      if (!json.app.hasOwnProperty(block.name)) {
        warn(
          `skipping proxying block '${block.name}'. not found in file.app.${
            block.name
          }`
        )
        return json
      }
      json.app[block.name].proxyPort = block.port.toString()
      return json
    }, endpointsFile)
  }

  toBase64() {
    return Buffer.from(JSON.stringify(this.json)).toString('base64')
  }

  getBaseEndpointForUrl(url) {
    const segments = url.split('/')
    if (segments.length < 2) {
      return { url: this.remoteEndpoint }
    }
    const block = segments[1]

    if (!this.json.app.hasOwnProperty(block)) {
      return {
        url: this.remoteEndpoint,
        blockNotFound: true
      }
    }

    const { proxyPort } = this.json.app[block]

    if (proxyPort) {
      return { url: `http://127.0.0.1:80` }
    }
    return { url: this.remoteEndpoint }
  }

  getJSON() {
    return this.json
  }
}

module.exports = EndpointsDefinition
