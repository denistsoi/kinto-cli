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
  return `docker run -p 80:80 -p 8080:8080 -e KINTO_CONFIG=${endpointsBase64} -e REDIS_HOST="$KINTO_HOST" -e RABBIT_HOST="$KINTO_HOST" -e AMBASSADOR_HOST="$KINTO_HOST" kintocloud.azurecr.io/gateway-middleware:local-proxy-v2`
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
