import network from './singleton/network.js';
import { ethers } from 'ethers';
import Config from './singleton/config.js';
import { Transact, GeometricGasPrice } from './transact.js';


const vatAbi = [
    {
        "constant": true,
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "can",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{ "internalType": "address", "name": "usr", "type": "address" }],
        "name": "hope",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];


const clipperAllowance = async (clipperAddress, _signer) => {
    const vatContract = new ethers.Contract(Config.vars.vat, vatAbi, network.provider);
    const initial_price = await _signer.getGasPrice();
    const gasStrategy = new GeometricGasPrice(initial_price.toNumber(), Config.vars.txnReplaceTimeout, Config.vars.dynamicGasCoefficient);

    try {
        const allowance = await vatContract.can(_signer.address, clipperAddress);
        if (allowance.toNumber() !== 1) {
            console.log('HOPING CLIPPER IN VAT');
            const hope_transaction = await vatContract.populateTransaction.hope(clipperAddress);
            const txn = new Transact(hope_transaction, _signer, Config.vars.txnReplaceTimeout, gasStrategy);
            await txn.transact_async();
        }
    } catch (error) {
        console.error(error);
    }
};

export default clipperAllowance;