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

exports.runKubectlProxies = env => {
  exec(
    `kubectl port-forward --namespace=${env} $(kubectl get pods --namespace ${env} -l "app=rabbitmq-ha" -o jsonpath="{.items[0].metadata.name}") 5672:5672`
  )
  exec(
    `kubectl port-forward --namespace=${env} $(kubectl get pods --namespace ${env} -l "app=mongodb-replicaset" -o jsonpath="{.items[0].metadata.name}") 27017:27017`
  )
  exec(
    `kubectl port-forward --namespace=${env} $(kubectl get pods --namespace ${env} -l "app=redis-ha, redis-role=master" -o jsonpath="{.items[0].metadata.name}") 6379:6379`
  )
}

exports.getEndpointForEnv = env =>
  env === 'prod' ? 'http://api.kintohub.com' : `http://api.${env}.kintohub.com`

exports.runLocalMiddleware = async endpointsBase64 => {
  await exec(exports.getDockerCommand(endpointsBase64))
}
