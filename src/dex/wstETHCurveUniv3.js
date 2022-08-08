import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import wstETHCurveUniv3CalleeAbi from '../../abi/WstETHCurveUniv3Callee.json';
import wstETHeAbi from '../../abi/WstETH.json';
import curvePoolAbi from '../../abi/CurvePool.json';
import quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";

export default class WstETHCurveUniv3Adaptor {

  constructor(asset, callee, name) {
    this._provider = network.provider;
    this._collateralName = name;
    this._callee = new ethers.Contract(
        callee, wstETHCurveUniv3CalleeAbi, this._provider
    );
    this._wstETH = new ethers.Contract(
        asset, wstETHeAbi, this._provider
    );
    this._curvePool = new ethers.Contract(
        Config.vars.collateral[name].curvePool, curvePoolAbi, this._provider
    );
    this._quoter = new ethers.Contract(
        Config.vars.UniswapV3QuoterAddress, quoter.abi, this._provider
    );
  }

  fetch = async (lot) => {
    let book = {
      sellAmount: '',
      receiveAmount: ''
    };

    const stethAmt = await this._wstETH.getStETHByWstETH(lot);
    const ethAmt = await this._curvePool.get_dy(
      1, // send token id 1 (stETH)
      0, // receive token id 0 (ETH)
      stethAmt
    );

    try {
      let quotedAmountOut = BigNumber.from(ethAmt);

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

      book.sellAmount = ethers.utils.formatUnits(lot);
      book.receiveAmount = ethers.utils.formatUnits(quotedAmountOut);
    } catch (e) {
      console.log(
          `Error fetching Uniswap amounts for ${this._collateralName}:`, e
      );
    }

    return book;
  }
}
