/* Key facility that allows auction-keeper user to use 
* his JSON wallet key to sign transactions
* As an alternative, user can also paste in his private key
*/

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import network from './singleton/network';

export default class Wallet {
    _passwordPath;
    _JSONKeystorePath;
    _rpcURL;

    constructor(passwordPath, JSONKeystorePath, rpcURL) {
        this._passwordPath = passwordPath;
        this._JSONKeystorePath = JSONKeystorePath;
        this._rpcURL = rpcURL; 
    }

    

    _getPassword() {
        try {
            const workingDirPath = path.resolve();
            const fullpath = path.join(workingDirPath, this._passwordPath);
            const data = fs.readFileSync(fullpath, 'utf8').toString();
            return data;
    
        } catch (error) {
            console.log('Error reading pass file', error.stack);
        }
    }

    async getWallet() {
        try {
            const workingPath = path.resolve();
            const fullPath = path.join(workingPath, this._JSONKeystorePath);
            const readJSON = fs.readFileSync(fullPath, 'utf8');
            const JSONWallet = JSON.parse(readJSON);
            if (!JSONWallet) console.log('Error with reading JSON Wallet');

            const JSONWalletPassword = this._getPassword();
            const wallet = await new ethers.Wallet.fromEncryptedJson(JSON.stringify(JSONWallet), JSONWalletPassword);

            network.rpcURL = this._rpcURL;
            const signer = new ethers.Wallet(wallet, network.provider);
            return signer;
        } catch (error) {
            console.log(error);
        }
    }
}
