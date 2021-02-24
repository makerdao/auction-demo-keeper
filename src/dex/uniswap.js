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

    // what format does ilkAmount have? is it in ETHER or WEI ? 
    fetch = async (ilkAmount) => {
        const WETH = await this._uniswap.WETH();

        const blockNumber = await this._provider.getBlockNumber();
        if (blockNumber === this._lastBlock) return;
        this._lastBlock = blockNumber;


        const offer = await this._uniswap.getAmountsOut(ilkAmount, [WETH, Config.vars.dai]);
        this._book = offer.map(v => ethers.utils.formatUnits(v));
    }
}