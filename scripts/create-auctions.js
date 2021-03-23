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
const dogAddress = '0x5f23786C20a8c6Fced4Aa9Eabd36C5D91bc2d144'; // setup dog contract address
const privateKey = ''; // insert wallet private key
let linkBalance;
const ilk = '0x4c494e4b2d410000000000000000000000000000000000000000000000000000';
let urns = [];


const kovanAddresses = {
    "DEPLOYER": "0x9EE5e175D09895b8E1E28c22b961345e1dF4B5aE",
    "MULTICALL": "0xb969003635975C7CA0b5489e6d79C8D30665aF4e",
    "FAUCET": "0xA96086e7fcDd3D878207983AF681B93b69985432",
    "MCD_DEPLOY": "0x476511c775b6606362E3DCcBdf62C975431C4DD4",
    "MCD_GOV": "0xdc267a50675A84B2e7f2DbAa96e613c13d64b7B6",
    "GOV_GUARD": "0xA102fF1cc2686d777fEB23500Ecf0DCe88FAb092",
    "MCD_IOU": "0x6d31308451e04d08dAB350efE3A27408E0c8AD49",
    "MCD_ADM": "0xcda65CeD2C16dbB2747C800129a9FFc9D0F657b6",
    "VOTE_PROXY_FACTORY": "0xbD7fF3Dc9cc7CD208D88fEa6391c8EaE63EBaa61",
    "MCD_VAT": "0xD9B6A6EB4dC7f1c791dAaC34D50eEc2B7445885D",
    "MCD_JUG": "0x07D43eDf023227d3EE50f92C9e93ca7894Ec7064",
    "MCD_CAT": "0xFbcc7ce95ce36DF7392bc72Fa75c86ec7378B755",
    "MCD_DOG": "0x3Bc32F97979BDBD893b3b30642c04e590AF94Cc2",
    "MCD_VOW": "0x32FCB5073599c669C92D63025390E86224F2A47A",
    "MCD_JOIN_DAI": "0x69a67283847C7342d8e9169655282D0aCf81a7d9",
    "MCD_FLAP": "0x7b3dDCB63FaD0Ac3284D11D0a1C51C794f027af8",
    "MCD_FLOP": "0xFaC19e1f4C013d2029Fe6C23D2d0a1a5369314bd",
    "MCD_PAUSE": "0x58bff54a052d9f87dA9529a1D80E926bdf269c05",
    "MCD_PAUSE_PROXY": "0x2B3ff3b00843ff904CB962ADb2CE2b64438eE198",
    "MCD_GOV_ACTIONS": "0xB7ef1D80888ae758e3E565B1C7165487F148220f",
    "MCD_DAI": "0x8EA5FC7aB9E3b628bebdFc37D87A17885af989F2",
    "MCD_SPOT": "0xC72Dc536f1997a80209d098fAA47db9dc5003a03",
    "MCD_POT": "0x05B4bADEA71E6bf4D80F37B49AF1625424991F3a",
    "MCD_END": "0x3F07B8b22487eD8DAE56504a5A127D54D253a282",
    "MCD_ESM": "0x8c9F86b5D6E0a0Bdf0abdda22c6783Afc6Ea0394",
    "PROXY_ACTIONS": "0x94f0392cC374c8096C97a330a34432F605d5cf89",
    "PROXY_ACTIONS_END": "0x22b417BbC93E9309955D3125a4DB7606DbBf44f0",
    "PROXY_ACTIONS_DSR": "0xf01fB3235335b8e12A5b421eb314675a54C1c1DB",
    "CDP_MANAGER": "0x7C651Dd3730BD4952F6F0ED5c72dF6851Cd6D441",
    "DSR_MANAGER": "0x8a594214B9008E9D5f3A5eF7F9174150a479B2c8",
    "GET_CDPS": "0xE1dcC4dA7a1704BC4b0a1ccA2c59ac5678b5De91",
    "ILK_REGISTRY": "0x6708fab415C07F4FB38889aD2360fB33d64fc49E",
    "OSM_MOM": "0x7993c1dacEE1d1503Efb1AE6A9EB37B46C453C7e",
    "FLIPPER_MOM": "0x0d914d0D0a0D16Af4F8A30166db0Ce2b32dDD55B",
    "MCD_IAM_AUTO_LINE": "0x50D041FA91433e28B4B2f04A5974a4F95286d82A",
    "PROXY_FACTORY": "0xe11E3b391F7E8bC47247866aF32AF67Dd58Dc800",
    "PROXY_REGISTRY": "0x64A436ae831C1672AE81F674CAb8B6775df3475C",
    "ETH": "0xc3F245DC8859E0fd6591fB9d12E485C15b8a11CE",
    "VAL_ETH": "0x75dD74e8afE8110C8320eD397CcCff3B8134d981",
    "PIP_ETH": "0x75dD74e8afE8110C8320eD397CcCff3B8134d981",
    "MCD_JOIN_ETH_A": "0x4db73C6D1fA3d011313b5B4EdA1764C9044d847e",
    "MCD_CLIP_ETH_A": "0xFFEeC8d778b3DAf71A66D2E4Cb91522e78ccA013",
    "MCD_CLIP_CALC_ETH_A": "0xed38D09274169330D7b004F751f63c0A19ECA3a9",
    "WBTC": "0xE179ef8A3D3D10DF92EE0260A53458eFa430bb49",
    "VAL_WBTC": "0x2f38a1bD385A9B395D01f2Cbf767b4527663edDB",
    "PIP_WBTC": "0x2f38a1bD385A9B395D01f2Cbf767b4527663edDB",
    "MCD_JOIN_WBTC_A": "0x78729A9Feb42a76164093CA6e0E13E86c73fdEEe",
    "MCD_FLIP_WBTC_A": "0xd46108c8F270B349A47A0b622bdd1a0f994dA48A",
    "LINK": "0x3903B96596C9CCB8DcADaDa9Dd7853B4E1D1a855",
    "VAL_LINK": "0x80aE17a3D567d2998D75C7586529dBF2543c54C9",
    "PIP_LINK": "0x80aE17a3D567d2998D75C7586529dBF2543c54C9",
    "MCD_JOIN_LINK_A": "0x63f9f6E224d3A62264BeBcbC871F8FaA09a4fc77",
    "MCD_CLIP_LINK_A": "0x2B6626bE628EBFB2BAC1959b209D04b38eE9507f",
    "MCD_CLIP_CALC_LINK_A": "0xFFf23C2561d7F9557672812a93e2B815CE1DED9d",
    "YFI": "0x9747c98A59Bb456aC885337F53E23666FF7C9F1c",
    "VAL_YFI": "0x9D8255dc4e25bB85e49c65B21D8e749F2293862a",
    "PIP_YFI": "0x9D8255dc4e25bB85e49c65B21D8e749F2293862a",
    "MCD_JOIN_YFI_A": "0xf67cc1d389E6cde3b1456800DfFAC76498A7CbDf",
    "MCD_CLIP_YFI_A": "0x86Bf554a7da5412ce1B50be820A9B6E23dfD4660",
    "MCD_CLIP_CALC_YFI_A": "0x7D1a89131323E0dbeC4e169415CbbB9A33Dc9d1F",
    "PROXY_PAUSE_ACTIONS": "0x48f8F981f5707723E5e5C8881860A75063D204BE",
    "PROXY_DEPLOYER": "0xd3234c1484582CdabB21D6B1A908D981eC7B3E56"
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

