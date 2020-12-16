/* Key facility that allows auction-keeper user to use 
* his JSON wallet key to sign transactions
* As an alternative, user can also paste in his private key
*/

// const fs = require('fs');
// const path = require('path');
// const ethers = require('ethers');

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// one needs to pass in the filepath to the wallet and password that is relative to the working directory

// const jsonWallet = '/tests/testwallet.json';
// const walletPass = '/tests/jsonpassword.txt';




// // Reads Password from the JSONWallet Password File
// function getPassword() {    
//     try {
//         // let data =  fs.readFileSync(walletPass, 'utf8');
//         const workingDirPath = path.resolve();
//         // const fullpath = path.join(workingDirPath,'auction-demo-keeper', walletPass);
//         const fullpath = path.join(workingDirPath, walletPass);
//         const data = fs.readFileSync(fullpath, 'utf8').toString();
//         console.log('data ', data);
//         return data;

//     } catch (error) {
//         console.log('Error reading pass file', error.stack);
//     }
    
// }
// // getPassword();

// async function getWallet() {
//     try {
//         const workingPath = path.resolve();
//         const fullPath = path.join(workingPath, jsonWallet);
//         const readJSON = fs.readFileSync(fullPath, 'utf8');
//         const JSONWallet = JSON.parse(readJSON);
//         if (!JSONWallet) console.log('Error with reading JSON Wallet');
//         const JSONWalletPassword = getPassword();
//         const wallet = await new ethers.Wallet.fromEncryptedJson(JSON.stringify(JSONWallet), JSONWalletPassword);
//         console.log('wallet', wallet);
//         return wallet;
//     } catch (error) {
//         console.log(error);
//     }

// }

// getWallet();

//to do`
// get test wallet from testchain pricat keys

// transforn it into a class
export default class Wallet {
    _passwordPath;
    _JSONKeystorePath;

    constructor(passwordPath, JSONKeystorePath) {
        this._passwordPath = passwordPath;
        this._JSONKeystorePath = JSONKeystorePath;
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
            return wallet;
        } catch (error) {
            console.log(error);
        }
    }
}

// const wallet = new Wallet('/tests/jsonpassword.txt', '/tests/testwallet.json');
// const signer = wallet.getWallet();
// console.log('Signer ', signer);