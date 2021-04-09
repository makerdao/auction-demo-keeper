import Keeper from './keeper.js';
// require('dotenv').config();
// const execSync = require('child_process').execSync;
// execSync('node src/start.js --wsurl ' + process.env.WSURL, {stdio: 'inherit'});
const keeper = new Keeper('https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a', 'kovan');
console.log('Keeper', keeper);
keeper.run();