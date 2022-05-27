import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers } from 'ethers';
import lpCurveUniv3CalleeAbi from '../../abi/LpCurveUniv3Callee.json' assert {type: 'json'};
import curvePoolAbi from '../../abi/CurvePool.json' assert {type: 'json'};
import quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json" assert {type: 'json'};

export default class LpCurveUniv3Adaptor {

  constructor(asset, callee, name) {
    this._provider = network.provider;
    this._asset = asset;
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
    this._uniV3TokenA       = Config.vars.collateral[name].uniV3Path[0].tokenA;
    this._dai          = Config.vars.collateral[name].uniV3Path[0].tokenB;
    this._uniV3poolFee = Config.vars.collateral[name].uniV3Path[0].fee;
  }

  fetch = async (lot) => {
    const ethAmt = await this._curvePool.calc_withdraw_one_coin(
      lot,
      this._curveCoinIndex,
      { gasLimit: 1000000 }
    );
    const daiAmt = await this._quoter.callStatic.quoteExactInputSingle(
      this._uniV3TokenA,
      this._dai,
      this._uniV3poolFee,
      ethAmt,
      0
    );

    const book = {
      sellAmount: ethers.utils.formatUnits(lot),
      receiveAmount: ethers.utils.formatUnits(daiAmt)
    };
    return book;
  }
}
