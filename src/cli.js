let argv = require('yargs')
  .scriptName('ethereum-demo-keeper')
  .usage('$0 <cmd> [args]')
  .option('wsurl', {
    describe: 'Specify the RPC URL of an ethereum node',
    type: 'string'
  })
  .demandOption(['wsurl'])
  .help()
  .argv;

import keeper from './keeper';
const keepr = new keeper(argv.wsurl);
keepr.run();

