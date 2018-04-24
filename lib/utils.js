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

exports.runKubectlProxies = () => {
  exec(
    'kubectl port-forward --namespace=staging $(kubectl get pods --namespace staging -l "app=rabbitmq-staging-rabbitmq" -o jsonpath="{.items[0].metadata.name}") 5672:5672'
  )
  exec(
    'kubectl port-forward --namespace=staging $(kubectl get pods --namespace staging -l "app=mongodb" -o jsonpath="{.items[0].metadata.name}") 27017:27017'
  )
  exec(
    'kubectl port-forward --namespace=staging $(kubectl get pods --namespace staging -l "app=redis-staging-redis" -o jsonpath="{.items[0].metadata.name}") 6379:6379'
  )
}

exports.runLocalMiddleware = async endpointsBase64 => {
  await exec(exports.getDockerCommand(endpointsBase64))
}
