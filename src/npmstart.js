require('dotenv').config();
const execSync = require('child_process').execSync;
execSync('node src/start.js --wsurl ' + process.env.WSURL, {stdio: 'inherit'});
