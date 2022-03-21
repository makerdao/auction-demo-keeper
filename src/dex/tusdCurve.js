import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import TusdCurveCalleeAbi from '../../abi/TusdCurveCallee.json';
import tusdCurvePoolAbi from '../../abi/TusdCurvePool.json';

export default class TusdCurveAdaptor {

  constructor(asset, callee, name) {
    this._provider = network.provider;
    this._asset = asset;
    this._name = name;
    this._callee = new ethers.Contract(
        callee, TusdCurveCalleeAbi, this._provider
    );
    this._curvePool = new ethers.Contract(
        Config.vars.collateral[name].curvePool, tusdCurvePoolAbi, this._provider
    );
  }

  fetch = async (lot) => {
    const daiAmt = await this._curvePool.functions['get_dy_underlying(int128,int128,uint256)'](0, 1, lot);

    const book = {
      sellAmount: ethers.utils.formatEther(lot.toString()),
      receiveAmount: ethers.utils.formatEther(daiAmt.toString())
    };
    return book;
  }
}
