import network from './singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import Config from './singleton/config.js';
import vatAbi from '../abi/vat.json';
import { Transact, GeometricGasPrice } from './transact.js';

const clipperAllowance = async (clipperAddress, _signer) => {
    const vatContract = new ethers.Contract(Config.vars.vat, vatAbi, network.provider);
    const initial_price = await _signer.getGasPrice();
    const gasStrategy = new GeometricGasPrice(initial_price.toNumber(), Config.vars.txnReplaceTimeout, Config.vars.dynamicGasCoefficient);

    try {
        const allowance = await vatContract.can(_signer.address, clipperAddress);
        if (!allowance.eq(1)) {
            console.log('HOPING CLIPPER IN VAT');
            const hope_transaction = await vatContract.populateTransaction.hope(clipperAddress);
            const txn = new Transact(hope_transaction, _signer, Config.vars.txnReplaceTimeout, gasStrategy);
            const response = await txn.transact_async();
            console.log(`Hoped Clipper Contract in VAT ${response.hash}`);
        }
    } catch (error) {
        console.error(error);
    }
};

const daiJoinAllowance = async (daiJoinAddress, _signer) => {
    const vatContract = new ethers.Contract(Config.vars.vat, vatAbi, network.provider);
    const initial_price = await _signer.getGasPrice();
    const gasStrategy = new GeometricGasPrice(initial_price.toNumber(), Config.vars.txnReplaceTimeout, Config.vars.dynamicGasCoefficient);

    try {
        const allowance = await vatContract.can(_signer.address, daiJoinAddress);
        if (!allowance.eq(1)) {
            console.log('HOPING DAI_JOIN IN VAT');
            const hope_transaction = await vatContract.populateTransaction.hope(daiJoinAddress);
            const txn = new Transact(hope_transaction, _signer, Config.vars.txnReplaceTimeout, gasStrategy);
            const response = await txn.transact_async();
            console.log(`Hoped DAI_JOIN Contract in VAT ${response.hash}`);
        }
    } catch (error) {
        console.error(error);
    }
};

const checkVatBalance = async (_signer) => {
    const decimals27 = ethers.utils.parseEther('1000000000');

    const vatContract = new ethers.Contract(Config.vars.vat, vatAbi, network.provider);
    const balance = await vatContract.dai(_signer.address);
    const daiToWithdraw = balance.div(decimals27);

    if (ethers.utils.formatUnits(daiToWithdraw) > 50) {
        await withdrawExtraDai(_signer, daiToWithdraw);
    }
};

const withdrawExtraDai = async (_signer, wadAmt) => {
    const daiJoinContract = new ethers.Contract(Config.vars.daiJoin, daiJoinAbi, network.provider);
    const initial_price = await _signer.getGasPrice();
    const gasStrategy = new GeometricGasPrice(initial_price.toNumber(), Config.vars.txnReplaceTimeout, Config.vars.dynamicGasCoefficient);

    try {
        console.log(`Withdrwaing tipped ${ethers.utils.formatUnits(wadAmt)} Dai from VAT`);
        const exit_transaction = await daiJoinContract.populateTransaction.exit(_signer.address, wadAmt);
        const txn = new Transact(exit_transaction, _signer, Config.vars.txnReplaceTimeout, gasStrategy);
        const response = await txn.transact_async();
        console.log(`Withdrew tipped Dai ${response.hash}`);
    } catch (error) {
        console.error(error);
    }

};


const daiJoinAbi = [
    {
        "constant": false,
        "inputs": [
            { "internalType": "address", "name": "usr", "type": "address" },
            { "internalType": "uint256", "name": "wad", "type": "uint256" }
        ],
        "name": "exit",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export {
    clipperAllowance,
    daiJoinAllowance,
    checkVatBalance
};
