import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import wstETHCurveUniv3CalleeAbi from '../../abi/WstETHCurveUniv3Callee.json';
import wstETHeAbi from '../../abi/WstETH.json';
import curvePoolAbi from '../../abi/CurvePool.json';

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
  }

  fetch = async (lot) => {
    const stethAmt = await this._wstETH.getStETHByWstETH(lot);
    const ethAmt = await this._curvePool.get_dy(
        1, // send token id 1 (stETH)
        0, // receive token id 0 (ETH)
        stethAmt
    );
    const daiAmt = ethAmt.mul(BigNumber.from('4000')); // TODO: set real number fron univ3

    const book = {
      sellAmount: ethers.utils.formatUnits(lot),
      receiveAmount: ethers.utils.formatUnits(daiAmt)
    };
    return book;
  }
}
