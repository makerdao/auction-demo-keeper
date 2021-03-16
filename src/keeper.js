/* eslint-disable no-unused-vars */
import oasisDexAdaptor from './dex/oasisdex';
import kovanConfig from '../config/kovan.json';
import testchainConfig from '../config/testchain.json';
import Config from './singleton/config';
import network from './singleton/network';
import Clipper from './clipper';
import { ethers } from 'ethers';
import UniswapAdaptor from './dex/uniswap.js';


/* The Keeper module is the entry point for the 
** auction Demo Keeper
* all configurations and intitalisation of the demo keeper is being handled here
*/

let _this;
export default class keeper {

  _clippers = [];

  constructor ( rpcUrl, net ) {

    let config;
    switch (net) {
      case 'kovan':
        config = kovanConfig;
        break;
      default:
        config = testchainConfig;
    }

    config.rpcURL = rpcUrl;
    Config.vars = config;
    network.rpcURL = rpcUrl;
    _this=this;
  }

  // Check if there's an opportunity in Uniswap & OasisDex to profit with a LIQ2.0 flash loan
  _opportunityCheck ( collateral, oasis, uniswap, clip ) {
    console.log('Check auction opportunities for ' + collateral.name);

    // Fetch the orderbook from OasisDex & all the active auctions
    Promise.all( [oasis.fetch(), clip.activeAuctions()] ).then( (res) => {
      const activeAuctions = res[1];

      console.log('Active auctions qty: ' + activeAuctions.length);

      // Look through the list of active auctions
      activeAuctions.forEach( auction => {

        // Pass in the entire auction size into Uniswap and store the Dai proceeds form the trade
        Promise.all( [uniswap.fetch(auction.lot)] ).then(() => {

          // Find the minimum effective exchange rate between collateral/Dai
          // e.x. ETH price 1000 DAI -> minimum profit of 1% -> new ETH price is 1000*1.01 = 1010
          const priceWithProfit = auction.price.mul(Config.vars.minProfitPercentage);

          // Find the amount of collateral that maximizes the amount of profit captured
          const oasisDexAvailability = oasis.opportunity(priceWithProfit);

          // Return the proceeds from the Uniswap market trade; proceeds were queried in uniswap.fetch()
          const uniswapProceeds = uniswap.opportunity();

          // Determine how much collateral we can trade on OasisDex
          const oasisSize = oasisDexAvailability.gt(auction.lot) ? auction.lot : oasisDexAvailability;

          console.log(`Auction # ${auction.id} \n
            Current price: ${auction.price}, \n
            Dai Proceeds from a full sell on Uniswap: ${ethers.utils.formatUnits(uniswapProceeds.receiveAmount)}
            Profitable collateral in OasisDex:${ethers.utils.formatUnits(oasisSize)}
            `);

          //TODO: Determine if we already have a pending bid for this auction

          // Check if there's a Dai profit from Uniswap by selling the entire auction
          if (uniswapProceeds.receiveAmount > priceWithProfit.mul(auction.lot)) {
            uniswap.execute( auction.id, auction.lot, auction.price );

          // If there's not a profit from Uniswap, use Oasis to sell a portion of
          // the collateral that maximizes the Dai profit
          } else if (oasisSize > 0) {
            oasis.execute( auction.id, Math.min(oasisSize, auction.lot), auction.price );
          }

        });

      });
    });
  }

  // Initialize the Clipper, OasisDex, and Uniswap JS wrappers
  async _clipperInit( collateral ) {
    const oasis = new oasisDexAdaptor( collateral.erc20addr, collateral.oasisCallee );
    const uniswap = new UniswapAdaptor( collateral.erc20addr, collateral.uniswapCallee );
    const clip = new Clipper( collateral.name , oasis);
    await oasis.fetch();
    await clip.init();

    // Initialize the loop where an opportunity is checked at a perscribed cadence (Cofnig.delay)
    const timer = setInterval(() => {this._opportunityCheck(collateral,oasis,uniswap,clip);}, Config.vars.delay * 1000);
    return({oasis, uniswap, clip, timer});
  }

  run() {
    for (const name in Config.vars.collateral) {
      if(Object.prototype.hasOwnProperty.call(Config.vars.collateral,name)) {
        const collateral = Config.vars.collateral[name];
        this._clipperInit(collateral).then(pair => {
          // add the pair to the array of clippers
          this._clippers.push(pair);
          console.log('Collateral ' + collateral.name + ' initialized');
        });
      }
    }
  }

  stop() {
    this._clippers.forEach(tupple => {
      clearTimeout(tupple.timer);
    });
  }
}
