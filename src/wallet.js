/* Key facility that allows auction-keeper user to use 
* his JSON wallet key to sign transactions
* As an alternative, user can also paste in his private key
*/

const ethers = require('ethers');
const fs = require('fs');

// import { ethers } from 'ethers';
// import fs from 'fs';

// Declare file path to JSONWalletKeystore and its password file
const jsonWallet = require('../tests/testwallet.json');
const walletPass = '../tests/walletPass.txt';

// Reads Password from the JSONWallet Password File
async function getPassword() {
    let password;
    try {
        let data = await fs.readFileSync(walletPass).toString();
        console.log('data ', data);
        password = await data.substring(0, data.length - 1);

    } catch (error) {
        console.log('Error reading pass file', error.stack);
    }
    console.log('password 2 ', password);
    return password;
}
// getPassword();

 async function getWallet() {
    const JSONWalletPath = JSON.stringify(jsonWallet);
    if (!JSONWalletPath) console.log('Error with reading JSON Wallet');

    const JSONWalletPassword = await getPassword();

    const wallet = await new ethers.Wallet.fromEncryptedJson(JSONWalletPath, JSONWalletPassword);
    console.log('wallet', wallet);
    return wallet;
}

getWallet();

//to do
// get test wallet from testchain pricat keys

// transforn it into a class