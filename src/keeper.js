import oasisDexAdaptor from './dex/oasisdex';
import mainnetConfig from '../config/mainnet.json';
import testchainConfig from '../config/testchain.json';
import Config from './singleton/config';
import network from './singleton/network';
import Clipper from './clipper';
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

  _opportunityCheck ( collateral, oasis, uniswap, clip ) {
    console.log('Check auction opportunities for ' + collateral.name);
    Promise.all( [oasis.fetch(), clip.activeAuctions()] ).then( (res) => {
      const activeAuctions = res[1];

      console.log('Active auctions qty: ' + activeAuctions.length);

      activeAuctions.forEach( auction => {

        Promise.all( [uniswap.fetch(auction.lot)] ).then(() => {

          const priceWithProfit = auction.price.mul(Config.vars.minProfitNum).div(Config.vars.minProfitDen)

          const oasisDexAvailability = oasis.opportunity(priceWithProfit);

          const uniswapProceeds = uniswap.opportunity();

          const oasisSize = oasisDexAvailability.gt(auction.lot) ? auction.lot : oasisDexAvailability;

          console.log(`Auction # ${auction.id} \n
            Current price: ${auction.price}, \n
            Dai Proceeds from a full sell on Uniswap: ${ethers.utils.formatUnits(uniswapProceeds.receiveAmount)}
            Profitable collateral in OasisDex:${ethers.utils.formatUnits(oasisSize)}
            `);

          //TODO: Determine if we already have a pending bid for this auction

          // Check if there's a Dai profit from Uniswap
          if (uniswapProceeds.receiveAmount > priceWithProfit.mul(auction.lot)) {
            uniswap.execute( auction.id, auction.lot, auction.price );

          // If there's not a profit from Uniswap, check OasisDex
          } else if (oasisSize > 0) {
            oasis.execute( auction.id, Math.min(oasisSize, auction.lot), auction.price );
          }

        });

      });
    });
  }

  async _clipperInit( collateral ) {
    const oasis = new oasisDexAdaptor( collateral.erc20addr, collateral.oasisCallee );
    const uniswap = new UniswapAdaptor( collateral.erc20addr, collateral.uniswapCallee );
    const clip = new Clipper( collateral.name , oasis);
    await oasis.fetch();
    await clip.init();

    const timer = setInterval(() => {this._opportunityCheck(collateral,oasis,uniswap,clip)}, Config.vars.delay * 1000);
    return({oasis, uniswap, clip, timer});
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
