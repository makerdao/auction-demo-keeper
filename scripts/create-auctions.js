//  Copyright (C) 2020 Maker Ecosystem Growth Holdings, INC.

//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
//  GNU Affero General Public License for more details.

//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

/*
* JS script intended to to create risky vaults with the LINK-A collateral.
* And call dog.bark() on all urns right after they are created. 
*
*__________________RUN____________________
* To run:
* - paste your private key in privateKey
* - paste dog contract address in dogAddress 
* - Get free Kovan LINK from https://kovan.chain.link/
* - Make sure to have enought Kovan ETH
*/

import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI, LINK } from '@makerdao/dai-plugin-mcd';

let maker;
let web3;
let kprAddress = '';
const dogAddress = ''; // setup dog contract address
const privateKey = ''; // insert wallet private key
let linkBalance;
const ilk = '0x4c494e4b2d410000000000000000000000000000000000000000000000000000';
let urns = [];


(async () => {
    console.log('Initiating Maker Service from Dai.js')
    maker = await Maker.create('http', {
        plugins: [McdPlugin],
        url: 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a',
        privateKey: privateKey
    });

    web3 = await maker.service('web3')._web3;
    console.log('web3 ', await web3.eth.net.getNetworkType());

    const kprAddress = maker.currentAddress();
    linkBalance = await maker.getToken(LINK).balance();
    console.log('Current Wallet Address: ', kprAddress);
    console.log('Link balance ', linkBalance._amount);

    if (Number(linkBalance._amount) < 16.49) throw 'NOT ENOUGHT LINK-A BALANCE';

    console.log('Ensure there is proxy address');
    await maker.service('proxy').ensureProxy();
    console.log('Proxy Address: ', await maker.service('proxy').getProxyAddress());

    while (Number(linkBalance._amount) > 16.49) {
        await createVaults();
    }

    //Barking on all urns
    console.log(' ');
    console.log('Risky Urns');

    const dogContract = new web3.eth.Contract(dogAbi, dogAddress);

    const bark = async (urn) => {
        dogContract.methods.bark(ilk, urn, kprAddress).send({from: kprAddress})
        .on('error', error => console.log(error))
        .on('receipt', receipt => console.log(receipt.events));
    };
    

    for (let i = 0; i < urns.length; i++) {
        console.log(urns[i]);
        // await bark(urns[i]);
    }

    process.kill(process.pid, 'SIGTERM');
})();

const createVaults = async () => {
    //create risky vault using ETH-A 
    console.log(' ');
    console.log('--------------------------------------------------------------------');
    console.log('Creating risky vault');
    const manager = maker.service('mcd:cdpManager');

    const vault = await manager.open('LINK-A');
    let vaultId = vault.id;
    console.log('Vault ID', vaultId);

    console.log('Locking 16.49 LINK-A');
    await manager.lock(
        vault.id,
        'LINK-A',
        LINK(16.49)
    );

    linkBalance = await maker.getToken(LINK).balance();

    console.log(' ');
    console.log('Dripping LINK-A JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip(ilk);


    // Refreshing vault data
    vault.reset();
    await vault.prefetch();

    // Reading Vault Information
    let managedVault = await manager.getCdp(vaultId);
    managedVault.reset();
    await managedVault.prefetch();
    const vaultUrnAddr = await manager.getUrn(vaultId);
    console.log('Vault: Urn Address', vaultUrnAddr);
    urns.push(vaultUrnAddr);

    const amtDai = await managedVault.daiAvailable._amount;

    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('DAI Available to Generate', managedVault.daiAvailable._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);

    console.log(' ');
    console.log(`Drawing ${DAI(amtDai.toFixed(17))} from Vault #${vaultId}`);

    try {
        let drawDai = await manager.draw(
            vaultId,
            'LINK-A',
            DAI(amtDai.toFixed(17))
        );
        drawDai;
    } catch (error) {
        console.error(error);
    }

    console.log(' ');
    console.log('Dripping LINK-A JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip(ilk);


    //Refreshing Vault Data
    managedVault.reset();
    await managedVault.prefetch();

    // Getting Updated state from Vault
    console.log(' ');
    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('DAI Available to Generate', managedVault.daiAvailable._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);
};



const dogAbi = [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "ilk",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "urn",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "kpr",
                "type": "address"
            }
        ],
        "name": "bark",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];