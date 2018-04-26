#!/usr/bin/env node

const program = require('commander')
const {
  updateConfig,
  viewConfig,
  clearConfig,
  proxyRequest
} = require('../lib')
const { error } = require('../lib/logger')
const pkg = require('../package.json')

program.version(pkg.version, '-v, --version')

program
  .command('init')
  .option('-e --env <env>', 'overwrite the default env (api.kintohub.com)')
  .description('Initialize the base env')
  .action(cmd => {
    updateConfig({ env: cmd.env })
  })

program
  .command('view-config')
  .description('view the config')
  .action(viewConfig)

program
  .command('clear-config')
  .description('remove all the saved config (need to do `kinto init` after)')
  .action(clearConfig)

program
  .command('proxy [appname]')
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
  .option(
    '-p --port <port>',
    'Port for the local dev server, default port is 8000',
    parseInt
  )
  .action(async (appName, options) => {
    proxyRequest({
      appName: appName,
      ...options
    })
  })

program.parse(process.argv)

// Check the program.args obj
var NO_COMMAND_SPECIFIED = program.args.length === 0

// Handle it however you like
if (NO_COMMAND_SPECIFIED) {
  // e.g. display usage
  program.help()
}
