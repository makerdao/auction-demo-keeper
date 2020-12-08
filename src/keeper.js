import oasisDexAdaptor from './dex/oasisdex';
import mainnetConfig from '../config/mainnet.json';
import testchainConfig from '../config/testchain.json';
import Config from './singleton/config';
import network from './singleton/network';
import clipper from './clipper';
import { ethers } from 'ethers';

let _this;
export default class keeper {
  _clippers = [];

  constructor ( rpcUrl, net ) {

    let config;
    switch (net) {
      case 'mainnet':
        config = mainnetConfig;
        break;
      default:
        config = testchainConfig;
    }

    config.rpcURL = rpcUrl;
    Config.vars = config;
    network.rpcURL = rpcUrl;
    _this=this;
  }

  _opportunityCheck ( collateral, oasis, clip ) {
    console.log('Check auction opportunities for ' + collateral.name);
    Promise.all( [oasis.fetch(), clip.activeAuctions()] ).then( (res) => {
      const activeAuctions = res[1];
      console.log('Active auctions qty: ' + activeAuctions.length);
      activeAuctions.forEach( auction => {
        const dexAvailability = oasis.opportunity(auction.price.mul(Config.vars.minProfitNum).div(Config.vars.minProfitDen));
        const size = dexAvailability.gt(auction.lot) ? auction.lot : dexAvailability;
        console.log('Auction #'+auction.id + ' Current price:' + auction.price + ', profitable collateral:'+ethers.utils.formatUnits(size));
        //TODO: Determine if we already have a pending bid for this auction
        if (size > Config.vars.minSize) oasis.execute( auction.id, Math.min(size, auction.lot), auction.price );
      });
    });
  }

  async _clipperInit( collateral ) {
    const oasis = new oasisDexAdaptor( collateral.erc20addr, collateral.callee );
    const clip = new clipper( collateral.name , oasis);
    await oasis.fetch();
    await clip.init();

    const timer = setInterval(() => {this._opportunityCheck(collateral,oasis,clip)}, Config.vars.delay);
    return({oasis, clip, timer});
  }

  run() {
    for (const name in Config.vars.collateral) {
      if(Object.prototype.hasOwnProperty.call(Config.vars.collateral,name)) {
        const collateral = Config.vars.collateral[name];
        this._clipperInit(collateral).then(pair => {
          this._clippers.push(pair);
          console.log('Collateral ' + collateral.name + ' initialized');
        });
      }
    }
  }

  stop() {
    this._clippers.forEach(tupple => {
      clearTimeout(tupple.timer);
    })
  }
}
