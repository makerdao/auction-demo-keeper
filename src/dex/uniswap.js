import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers } from 'ethers';
import uniswapRouter from '../../abi/UniswapV2Router02.json';
import uniswapCalleeAbi from '../../abi/UniswapV2CalleeDai.json';

export default class UniswapAdaptor {
    _book = {
        sellAmount: '',
        receiveAmount: ''
    };
    _lastBlock = 0;
    _collateralName = ''

    constructor(assetAddress, callee, collateralName) {
        this._provider = network.provider;
        this._asset = assetAddress;
        this._collateralName = collateralName;
        this._callee = new ethers.Contract(callee, uniswapCalleeAbi, this._provider);
        this._uniswap = new ethers.Contract(Config.vars.UniswapV2Router, uniswapRouter, this._provider);
    }

    // ilkAmount in WEI
    fetch = async (ilkAmount) => {
        const blockNumber = await this._provider.getBlockNumber();
        if (blockNumber === this._lastBlock) return;
        this._lastBlock = blockNumber;

        const offer = await this._uniswap.getAmountsOut(ilkAmount, Config.vars.collateral[this._collateralName].uniswapRoute);
        this._book.sellAmount = ethers.utils.formatUnits(offer[0]);
        this._book.receiveAmount = ethers.utils.formatUnits(offer[offer.length-1]);
    }

    opportunity = () => {
        return this._book;
    }
}
