import Config from '../singleton/config';
import network from '../singleton/network';
import { ethers, BigNumber } from 'ethers';
import uniswapRouter from '../../abi/UniswapV2Router02.json';
// import uniswap contract ABis


export default class UniswapAdaptor {
    _book=[]
    _lastBlock = 0;
    _asset;

    constructor(asset) {
        this.provider = network.provider;
        this._asset = asset;
        this._uniswap = new ethers.Contract(Config.vars.uniswap, uniswapRouter, this._provider);
    }

    opportunity = async (ilkAmount) => {
        const blockNumber = await this._provider.getBlockNumber();
        if (blockNumber === this._lastBlock) return;
        this._lastBlock = blockNumber;

        const WETH = await this._uniswap['WETH()'];

        const offer = await this._uniswap['getAmountsOut(uint amountIn, address[] memory path)'](ilkAmount, [`${WETH}`, `${Config.vars.dai}`]);
    }
}