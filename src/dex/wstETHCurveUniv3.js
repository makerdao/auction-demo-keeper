import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import wstETHCurveUniv3CalleeAbi  from '../../abi/WstETHCurveUniv3Callee.json';

export default class WstETHCurveUniv3Adaptor {
  _lastBlock = 0;
  _asset;
  _decimals10 = BigNumber.from('10000000000');
  _decNormalized;

  constructor(asset, callee, name) {
    this._provider = network.provider;
    this._asset = asset;
    this._name = name;
    this._callee = new ethers.Contract(callee, wstETHCurveUniv3CalleeAbi, this._provider);
  }

  opportunity = (price) => {
  };
}
