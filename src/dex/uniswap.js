import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import uniswapRouter from '../../abi/UniswapV2Router02.json';
import uniswapCalleeAbi from '../../abi/UniswapV2CalleeDai.json';

export default class UniswapAdaptor {
  _lastBlock = 0;
  _collateralName = '';
  _decNormalized;

  constructor(assetAddress, callee, collateralName) {
    this._provider = network.provider;
    this._asset = assetAddress;
    this._collateralName = collateralName;
    this._decNormalized = BigNumber.from('10').pow(
      18 - Config.vars.collateral[collateralName].decimals
    );
    this._callee = new ethers.Contract(
      callee, uniswapCalleeAbi, this._provider
    );
    this._uniswap = new ethers.Contract(
      Config.vars.UniswapV2Router, uniswapRouter, this._provider
    );
  }

  // ilkAmount in WEI
  fetch = async (_ilkAmount) => {
    let ilkAmount = BigNumber.from(_ilkAmount).div(this._decNormalized);
    let book = {
      sellAmount: '',
      receiveAmount: ''
    };
    try {
      const blockNumber = await this._provider.getBlockNumber();
      if (blockNumber === this._lastBlock) return;
      this._lastBlock = blockNumber;

      const offer = await this._uniswap.getAmountsOut(
        ilkAmount, Config.vars.collateral[this._collateralName].uniswapRoute
      );
      book.sellAmount = ethers.utils.formatUnits(
        offer[0].mul(this._decNormalized)
      );
      book.receiveAmount = ethers.utils.formatUnits(
        offer[offer.length - 1]
      );
      return book;
    } catch (e) {
      console.log(
        `Error fetching Uniswap amounts for ${this._collateralName}:`, e
      );
    }
  }
}
