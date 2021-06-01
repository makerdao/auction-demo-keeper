import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import uniswapRouter from '../../abi/UniswapV2Router02.json';
import uniswapCalleeAbi from '../../abi/UniswapV2CalleeDai.json';

export default class UniswapAdaptor {
    _book = {
        sellAmount: '',
        receiveAmount: ''
    };
    _lastBlock = 0;
    _collateralName = '';
    _decimals10 = BigNumber.from('10000000000');

    constructor(assetAddress, callee, collateralName) {
        this._provider = network.provider;
        this._asset = assetAddress;
        this._collateralName = collateralName;
        this._callee = new ethers.Contract(callee, uniswapCalleeAbi, this._provider);
        this._uniswap = new ethers.Contract(Config.vars.UniswapV2Router, uniswapRouter, this._provider);
    }

    // ilkAmount in WEI
    fetch = async (_ilkAmount) => {
        let ilkAmount;
        if (this._collateralName === 'WBTC-A') {
            ilkAmount = BigNumber.from(_ilkAmount).div(this._decimals10);
        } else {
            ilkAmount = _ilkAmount;
        }
        try {
            const blockNumber = await this._provider.getBlockNumber();
            if (blockNumber === this._lastBlock) return;
            this._lastBlock = blockNumber;

            const offer = await this._uniswap.getAmountsOut(ilkAmount, Config.vars.collateral[this._collateralName].uniswapRoute);
            this._book.sellAmount = this._collateralName === 'WBTC-A' ? ethers.utils.formatUnits(offer[0].mul(this._decimals10)) : ethers.utils.formatUnits(offer[0]);
            this._book.receiveAmount = ethers.utils.formatUnits(offer[offer.length - 1]);
        } catch (e) {
            console.log(`Error fetching Uniswap amounts for ${this._collateralName}:`, e);
        }

    }

    opportunity = () => {
        return this._book;
    }
}
