import Config from '../singleton/config';
import network from '../singleton/network';
import { ethers, BigNumber } from 'ethers';
import supportMethodsAbi from '../../abi/MakerOtcSupportMethods.json';
import matchingMarketAbi from '../../abi/MatchingMarket.json';
import oasisCalleeAbi from '../../abi/CalleeMakerOtcDai.json';


export default class oasisDexAdaptor {
  _book = [];
  _lastBlock = 0;
  _asset;
  constructor(asset, callee) {
    this._provider = network.provider;
    this._asset = asset;
    this._otcSupportMethods = new ethers.Contract(Config.vars.MakerOTCSupportMethods, supportMethodsAbi, this._provider);
    this._oasisDex = new ethers.Contract(Config.vars.OasisDex, matchingMarketAbi, this._provider);
    this._callee = new ethers.Contract(callee, oasisCalleeAbi, this._provider);

    //TODO: Optimize by subscribing to contract events to update _book without explicit refetch.
  }

  fetch = async () => {
    const blockNumber = await this._provider.getBlockNumber();
    if (blockNumber === this._lastBlock) return;

    this._lastBlock = blockNumber;
    const offers = await this._otcSupportMethods['getOffers(address,address,address)'](Config.vars.OasisDex,
      Config.vars.dai, this._asset);
    this._book = offers.ids.map((v, i) => ({ id: v, payAmt: offers.payAmts[i], buyAmt: offers.buyAmts[i] }))
      .filter(v => (!(v.id.eq(0))));
  };

  baseBook = () => {
    return this._book.map(entry => {
      return {
        id: entry.id.toNumber(),
        payAmt: ethers.utils.formatUnits(entry.payAmt),
        buyAmt: ethers.utils.formatUnits(entry.buyAmt)
      }
    });
  };

  opportunity = (price) => {
    //Total amount of collateral available for sale for a certain price
    return this._book
      .filter(v => v.payAmt.div(v.buyAmt).gte(price.div(ethers.constants.WeiPerEther)))
      .reduce((previous, current) => previous.add(current.buyAmt), BigNumber.from(0));
  };




}
