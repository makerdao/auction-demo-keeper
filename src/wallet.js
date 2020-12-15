/* Key facility that allows auction-keeper user to use 
* his JSON wallet key to sign transactions
* As an alternative, user can also paste in his private key
*/

const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

// import { ethers } from 'ethers';
// import fs from 'fs';
// import path from 'path';

// one needs to pass in the filepath to the wallet and password that is relative to the working directory

const jsonWallet = '/tests/testwallet.json';
const walletPass = '/tests/jsonpassword.txt';


// console.log('paths', jsonWallet, walletPass);


// Reads Password from the JSONWallet Password File
function getPassword() {    
    try {
        // let data =  fs.readFileSync(walletPass, 'utf8');
        const workingDirPath = path.resolve();
        // const fullpath = path.join(workingDirPath,'auction-demo-keeper', walletPass);
        const fullpath = path.join(workingDirPath, walletPass);
        const data = fs.readFileSync(fullpath, 'utf8').toString();
        console.log('data ', data);
        return data;

    } catch (error) {
        console.log('Error reading pass file', error.stack);
    }
    
}
// getPassword();

async function getWallet() {
    try {
        const workingPath = path.resolve();
        const fullPath = path.join(workingPath, jsonWallet);
        const readJSON = fs.readFileSync(fullPath, 'utf8');
        const JSONWallet = JSON.parse(readJSON);
        if (!JSONWallet) console.log('Error with reading JSON Wallet');
        const JSONWalletPassword = getPassword();
        const wallet = await new ethers.Wallet.fromEncryptedJson(JSON.stringify(JSONWallet), JSONWalletPassword);
        console.log('wallet', wallet);
        return wallet;
    } catch (error) {
        console.log(error);
    }

}

getWallet();

//to do`
// get test wallet from testchain pricat keys

// transforn it into a class
