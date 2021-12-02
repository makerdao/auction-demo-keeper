import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import wstETHCurveUniv3CalleeAbi from '../../abi/WstETHCurveUniv3Callee.json';
import wstETHeAbi from '../../abi/WstETH.json';
import curvePoolAbi from '../../abi/CurvePool.json';
import quoterAbi from '../../abi/Quoter.json';

export default class WstETHCurveUniv3Adaptor {

  constructor(asset, callee, name) {
    this._provider = network.provider;
    this._asset = asset;
    this._name = name;
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
        Config.vars.QuoterAddress, quoterAbi, this._provider
    );
    this._weth         = Config.vars.collateral[name].uniV3Path[0].tokenA;
    this._dai          = Config.vars.collateral[name].uniV3Path[0].tokenB;
    this._uniV3poolFee = Config.vars.collateral[name].uniV3Path[0].fee;
  }

  fetch = async (lot) => {
    const stethAmt = await this._wstETH.getStETHByWstETH(lot);
    const ethAmt = await this._curvePool.get_dy(
      1, // send token id 1 (stETH)
      0, // receive token id 0 (ETH)
      stethAmt
    );
    const daiAmt = await this._quoter.callStatic.quoteExactInputSingle(
      this._weth,
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
