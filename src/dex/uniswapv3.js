import { ethers, BigNumber } from 'ethers';
import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import uniswapRouter from '../../abi/UniswapV3Router.json';
import uniswapV3CalleeAbi from '../../abi/UniswapV3CalleeDai.json';
import quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";

export default class UniswapV3Adaptor {
  _collateralName = '';
  _decNormalized;

  constructor(callee, collateralName) {
    this._provider = network.provider;
    this._collateralName = collateralName;
    this._decNormalized = BigNumber.from('10').pow(
      18 - Config.vars.collateral[collateralName].decimals
    );
    this._callee = new ethers.Contract(
      callee, uniswapV3CalleeAbi, this._provider
    );
    this._quoter = new ethers.Contract(
      Config.vars.UniswapV3QuoterAddress, quoter.abi, this._provider
    );
  }

  // ilkAmount in WEI
  fetch = async (_ilkAmount) => {
    let book = {
      sellAmount: '',
      receiveAmount: ''
    };

    try {
      let quotedAmountOut = BigNumber.from(_ilkAmount).div(this._decNormalized);

      for (let i = 0; i < Config.vars.collateral[this._collateralName].uniV3Path.length; i++) {
        // call the quoter contract to determine the amount out of a swap
        quotedAmountOut = await this._quoter.callStatic.quoteExactInputSingle(
          Config.vars.collateral[this._collateralName].uniV3Path[i].tokenA,
          Config.vars.collateral[this._collateralName].uniV3Path[i].tokenB,
          Config.vars.collateral[this._collateralName].uniV3Path[i].fee,
          quotedAmountOut,
          0
        );
      }

      book.sellAmount = ethers.utils.formatUnits(_ilkAmount);
      book.receiveAmount = ethers.utils.formatUnits(quotedAmountOut);
    } catch (e) {
      console.log(
        `Error fetching Uniswap amounts for ${this._collateralName}:`, e
      );
    }

    return book;
  }
}
