import Keeper from './keeper.js';
import path from 'path';

const configPath = path.join(path.resolve(), 'config/mainnet.json');
const passwordPath = path.join(path.resolve(), '/wallet/password.txt');
const keystorePath = path.join(path.resolve(), '/wallet/keystore.json');

const keeper = new Keeper(configPath, passwordPath, keystorePath);
console.log('\nInitializing Keeper\n');
keeper.run();