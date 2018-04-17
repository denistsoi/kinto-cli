#!/usr/bin/env node

const util = require('util')
const exec = util.promisify(require('child_process').exec)
const program = require('commander')
const kinto = require('../lib')

program.version('0.1.0', '-v, --version')

program
  .command('init')
  .option('-e --endpoint <endpoint>', 'overwrite the default endpoint')
  .description('Initialize the base endpoint')
  .action(cmd => {
    const endpoint = cmd.endpoint || 'http://api.kintohub.com'
    kinto.updateConfig({ endpoint })
  })

program
  .command('view-config')
  .description('view the config')
  .action(() => {
    console.log(kinto.getConfig())
  })

program
  .command('proxy <appname>')
  .description('proxy for kintoblocks inside the provided kintoapp')
  .option(
    '-b, --block <block:port>',
    'An array of blocks, the proxy defaults to 8080 (required)',
    (block, blocks) => {
      const splitted = block.split(':')
      blocks.push({
        name: splitted[0],
        port: splitted[1] || '8080'
      })
      return blocks
    },
    []
  )
  .option(
    '-f --file <file>',
    'you can use a config json file instead of passing the blocks'
  )
  .action(async (appName, options) => {
    if (!options.block.length && !options.file) {
      return error('missing required flag --block')
    }
    if(await isDockerRunning()) {
      return error('docker must be running')
    }

    console.log(
      `blocks: ${options.block}, appname: ${appName}, file: ${options.file}`
    )
  })

program.parse(process.argv)

// Check the program.args obj
var NO_COMMAND_SPECIFIED = program.args.length === 0

// Handle it however you like
if (NO_COMMAND_SPECIFIED) {
  // e.g. display usage
  program.help()
}

function error(message) {
  return console.error(`\nerror: ${message}\n`)
}

async function isDockerRunning() {
  try {
    await exec('docker ps')
    return true
  } catch (e) {
    return false
  }
}
