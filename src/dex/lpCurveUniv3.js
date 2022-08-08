import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers } from 'ethers';
import lpCurveUniv3CalleeAbi from '../../abi/LpCurveUniv3Callee.json';
import curvePoolAbi from '../../abi/CurvePool.json';
import quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";

export default class LpCurveUniv3Adaptor {

  constructor(asset, callee, name) {
    this._provider = network.provider;
    this._name = name;
    this._callee = new ethers.Contract(
        callee, lpCurveUniv3CalleeAbi, this._provider
    );
    this._curvePool = new ethers.Contract(
        Config.vars.collateral[name].curveData.pool, curvePoolAbi, this._provider
    );
    this._curveCoinIndex = Config.vars.collateral[name].curveData.coinIndex
    this._quoter = new ethers.Contract(
        Config.vars.UniswapV3QuoterAddress, quoter.abi, this._provider
    );
  }

  fetch = async (lot) => {
    const ethAmt = await this._curvePool.calc_withdraw_one_coin(
      lot,
      this._curveCoinIndex,
      { gasLimit: 1000000 }
    );

    let quotedAmountOut = ethAmt;
    for (let i = 0; i < Config.vars.collateral[this._name].uniV3Path.length; i++) {
      // call the quoter contract to determine the amount out of a swap
      quotedAmountOut = await this._quoter.callStatic.quoteExactInputSingle(
          Config.vars.collateral[this._name].uniV3Path[i].tokenA,
          Config.vars.collateral[this._name].uniV3Path[i].tokenB,
          Config.vars.collateral[this._name].uniV3Path[i].fee,
          quotedAmountOut,
          0
      );
    }

    const book = {
      sellAmount: ethers.utils.formatUnits(lot),
      receiveAmount: ethers.utils.formatUnits(quotedAmountOut)
    };
    return book;
  }
}
