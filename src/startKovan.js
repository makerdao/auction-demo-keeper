import Keeper from './keeper.js';
import path from 'path';

const configPath = path.join(path.resolve(), 'config/kovan.json');
const passwordPath = path.join(path.resolve(), '/wallet/jsonpassword.txt');
const keystorePath = path.join(path.resolve(), '/wallet/testwallet.json');

const keeper = new Keeper(configPath, passwordPath, keystorePath);
console.log('\nInitializing Keeper\n');
keeper.run();