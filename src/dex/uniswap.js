import Config from '../singleton/config';
import network from '../singleton/network';
import { ethers, BigNumber } from 'ethers';
import uniswapRouter from '../../abi/UniswapV2Router02.json';


export default class UniswapAdaptor {
    _book=[]
    _lastBlock = 0;
    _asset;

    constructor(asset) {
        this.provider = network.provider;
        this._asset = asset;
        this._uniswap = new ethers.Contract(Config.vars.uniswap, uniswapRouter, this._provider);
    }

    // ilkAmount in WEI
    fetch = async (ilkAmount) => {
        const WETH = await this._uniswap.WETH();

        const blockNumber = await this._provider.getBlockNumber();
        if (blockNumber === this._lastBlock) return;
        this._lastBlock = blockNumber;


        const offer = await this._uniswap.getAmountsOut(ilkAmount, [WETH, Config.vars.dai]);
        this._book.push({sellAmount: ethers.utils.formatUnits(offer[0])});
        this._book.push({receiveAmount: ethers.utils.formatUnits(offer[1])});
    }

    opportunity = () => {
        return this._book;
    }
}
