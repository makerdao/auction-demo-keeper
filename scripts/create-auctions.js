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
const privateKey = 'fe85ccc0f2d39869bda4ae998600bea99eedb57c45aabc4718a1f80ef0a53655'; // insert wallet private key
let linkBalance;
const ilk = '0x4c494e4b2d410000000000000000000000000000000000000000000000000000';
let urns = [];


const kovanAddresses = {
    "DEPLOYER": "0xDA0111100cb6080b43926253AB88bE719C60Be13",
    "MULTICALL": "0x8627ca1449CF3a9A8D2d698EF24c1ecd79f79d66",
    "FAUCET": "0xDd0E6f93Bb5b491139Ed415844Ae52FffeEE3F04",
    "MCD_DEPLOY": "0x960B8b4d57f2B41D3eb5462dc5d667C39D28517F",
    "MCD_GOV": "0xb635Ba83B00035Ea031cB4939dc0ED462a2894F8",
    "GOV_GUARD": "0x0bdf035C7509AeD383a0EFa3dcCE90E1B28F0C6d",
    "MCD_IOU": "0x90D312bA3734912a4cB4Ede443eaB6D6e779d1C9",
    "MCD_ADM": "0x7Ff0E72F5641300D7Ad95f68738e9d29aBF1B0aA",
    "VOTE_PROXY_FACTORY": "0x7cF30a6400a824756dF42616a8c0063628Be01d0",
    "MCD_VAT": "0xf93c7F630f44c35648353b3C4897523e185e233f",
    "MCD_JUG": "0x0096FA08f636b38e4231De9025FCB8cc355B3626",
    "MCD_CAT": "0xC84D978d0a0062F9F3A0b3ff56a3808DB7f9D166",
    "MCD_DOG": "0x5f23786C20a8c6Fced4Aa9Eabd36C5D91bc2d144",
    "MCD_VOW": "0x9968C39a862Ba68aa15DBb2a86a1224C26F76FC5",
    "MCD_JOIN_DAI": "0x5e32b4759f94598Ced54C714d118251C67f0eBcc",
    "MCD_FLAP": "0xBf290cF74AF74DC4010CF6560cEaf2a1A0C3fb7E",
    "MCD_FLOP": "0x4b68D8Ff26301408D44cD68f5eB7F7F8F631c091",
    "MCD_PAUSE": "0x945876f96A4525d0F4dF63e1ED862EbDd30a9f28",
    "MCD_PAUSE_PROXY": "0x0AE53A16398174Ab8d70687c15628a9e7ce643e7",
    "MCD_GOV_ACTIONS": "0xD2eeBb64a97D33907B9ff7e91412C95e10c540e7",
    "MCD_DAI": "0x200B9eA08CbE5f26D6b3FD85C5387EF70E51A05F",
    "MCD_SPOT": "0xda2E997B04Da5D127E2A00EE9133426AB8198b85",
    "MCD_POT": "0x2453B702D61466D1fCc5B76819DDfA4398F86469",
    "MCD_END": "0x813541BE3E1c3Ec547f75Eb9438Ac7bb1dd0E764",
    "MCD_ESM": "0x9A380802CF714714171bDD23de5b961c26509426",
    "PROXY_ACTIONS": "0x72854Cc0499167d269125d1050225e770c79b34D",
    "PROXY_ACTIONS_END": "0xe4a9DA5f56a983415Eedc7eFB84Bc44812fc7719",
    "PROXY_ACTIONS_DSR": "0x30fBaFE9996C4977C379eE4f0343198458e6ee14",
    "CDP_MANAGER": "0xE00270BF8A06Fa59bed90677760C678Ae97bFEF0",
    "DSR_MANAGER": "0x33374087c789726E77EB4888e53e68E0e09a93A3",
    "GET_CDPS": "0xc6c9c42CEa8377e98377DEA646720e33b5c8883D",
    "ILK_REGISTRY": "0x151a04a9345f844C9DC4Ee1FE1d502115eD13187",
    "OSM_MOM": "0xB4a8C5672FE90a75aBce9C0e88280a40c539065E",
    "FLIPPER_MOM": "0x840DE197b02dafE3c6E90088D2718f54e4d235eF",
    "MCD_IAM_AUTO_LINE": "0x9924210b4a096e77E61a24814C3D1EA034935e0b",
    "PROXY_FACTORY": "0xe11E3b391F7E8bC47247866aF32AF67Dd58Dc800",
    "PROXY_REGISTRY": "0x64A436ae831C1672AE81F674CAb8B6775df3475C",
    "ETH": "0x8013846e944339366FA34D60b56Cc675449DF0f0",
    "VAL_ETH": "0x75dD74e8afE8110C8320eD397CcCff3B8134d981",
    "PIP_ETH": "0x75dD74e8afE8110C8320eD397CcCff3B8134d981",
    "MCD_JOIN_ETH_A": "0x0F8CdafB2fc2Bda98Cfd9D9210EEb576F920471E",
    "MCD_CLIP_ETH_A": "0x7Ca4abf287FAE0d9601F006FD68F43a32aec404d",
    "MCD_CLIP_CALC_ETH_A": "0xEbA57319017b6159DBb5d22bc4941EB3099df137",
    "WBTC": "0xE585Ee8d96E22FE5556b92Ddf50D084863FE3C81",
    "VAL_WBTC": "0x2f38a1bD385A9B395D01f2Cbf767b4527663edDB",
    "PIP_WBTC": "0x2f38a1bD385A9B395D01f2Cbf767b4527663edDB",
    "MCD_JOIN_WBTC_A": "0x2D796e7B25c7eE09a238509D34E39b6f43C3449f",
    "MCD_FLIP_WBTC_A": "0xc5fbb51BF39D8d65B23C58BdC5bFFB13562C19eE",
    "LINK": "0xb492772f18FBA204a6184e6C1742FB223CC147ed",
    "VAL_LINK": "0x20D5A457e49D05fac9729983d9701E0C3079Efac",
    "PIP_LINK": "0x20D5A457e49D05fac9729983d9701E0C3079Efac",
    "MCD_JOIN_LINK_A": "0xafEBdF5B17c40f3c329d5549a969be30ed2C593E",
    "MCD_CLIP_LINK_A": "0x0C2762C7795f9bF8ea6d485a94f98644f316a89a",
    "MCD_CLIP_CALC_LINK_A": "0x8274fe91FA8b72A8dF61114c8cB7758921917050",
    "YFI": "0x8ab72EF41e9da54F472137Ffe88Ef4E83F3b7fFa",
    "VAL_YFI": "0x9D8255dc4e25bB85e49c65B21D8e749F2293862a",
    "PIP_YFI": "0x9D8255dc4e25bB85e49c65B21D8e749F2293862a",
    "MCD_JOIN_YFI_A": "0xb7C9b65f51B062B4C8B446A8ad8CdD44b0477FD0",
    "MCD_CLIP_YFI_A": "0xC0a611647B6f1c2FAA32B43c8441690ce38b439D",
    "MCD_CLIP_CALC_YFI_A": "0x5C7f92F2712E9B59D42577e1627A859459630139",
    "PROXY_PAUSE_ACTIONS": "0x3b4387D7CD7ccc7dd2F2dCbf389ed3becD19df10",
    "PROXY_DEPLOYER": "0x386a9fDeF5B5ebdc1a48DF5e98f89dC4280c9e84"
};


(async () => {
    //Setting up custom kovan contracts

    const otherNetworksOverrides = [
        { network: 'kovan', contracts: kovanAddresses }
    ].reduce((acc, { network, contracts }) => {
        for (const [contractName, contractAddress] of Object.entries(contracts)) {
            if (!acc[contractName]) acc[contractName] = {};
            acc[contractName][network] = contractAddress;
        }
        return acc;
    }, {});

    const addressOverrides = ['kovan'].some(
        networkName => networkName === 'kovan'
    )
        ? otherNetworksOverrides
        : {};

    const cdpTypes = [
        { currency: ETH, ilk: 'ETH-A' },
        { currency: LINK, ilk: 'LINK-A' }
    ];

    const mcdPluginConfig = {
        cdpTypes,
        addressOverrides
    };


    console.log('Initiating Maker Service from Dai.js');
    maker = await Maker.create('http', {
        plugins: [
            [McdPlugin, mcdPluginConfig]
        ],
        smartContract: {
            addressOverrides
        },
        url: 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a',
        privateKey: privateKey
    });

    web3 = await maker.service('web3')._web3;
    console.log('web3 ', await web3.eth.net.getNetworkType());

    const kprAddress = maker.currentAddress();
    const linkToken = await maker.getToken(LINK);
    linkBalance = await linkToken.balance();
    console.log('Current Wallet Address: ', kprAddress);
    console.log('Link balance ', linkBalance._amount);

    if (Number(linkBalance._amount) < 16.49) throw 'NOT ENOUGHT LINK-A BALANCE';

    console.log('Ensure there is proxy address');
    await maker.service('proxy').ensureProxy();
    const proxyAddress = await maker.service('proxy').getProxyAddress();
    console.log('Proxy Address: ', proxyAddress);

    //Check for token allowance
    const linkAllowance = await linkToken.allowance(kprAddress, proxyAddress);
    if (Number(linkAllowance._amount) === 0) {
        console.log('Approving Proxy to use LINK');
        await linkToken.approveUnlimited(proxyAddress);
    }

    while (Number(linkBalance._amount) > 16.49) {
        await createVaults();
    }


    //Barking on all urns
    console.log(' ');
    console.log('Risky Urns');

    const dogContract = new web3.eth.Contract(dogAbi, dogAddress);


    const bark = async (urn) => {
        await dogContract.methods.bark(ilk, urn, kprAddress)
            .send({
                from: kprAddress,
                gasPrice: '20000000000'
            })
            .on('error', error => console.log(error))
            .on('receipt', receipt => console.log(receipt.events));
    };
    // try {
    //     console.log('Barking 0xe73F83BaD0D26D6f27F16943684430937DD71eAA');
    //     await bark('0xe73F83BaD0D26D6f27F16943684430937DD71eAA');
    // } catch (error) {
    //     console.error(error);
    // }


    for (let i = 0; i < urns.length; i++) {
        console.log('Barking ', urns[i]);
        await bark(urns[i]);
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

