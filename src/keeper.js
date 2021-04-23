/* eslint-disable no-unused-vars */
import oasisDexAdaptor from './dex/oasisdex.js';
import kovanConfig from '../config/kovan.json';
import mainnetConfig from '../config/mainnet.json';
import Config from './singleton/config.js';
import network from './singleton/network.js';
import Clipper from './clipper.js';
import { ethers, BigNumber } from 'ethers';
import UniswapAdaptor from './dex/uniswap.js';
import Wallet from './wallet.js';
import { clipperAllowance, checkVatBalance } from './vat.js';

/* The Keeper module is the entry point for the
 ** auction Demo Keeper
 * all configurations and intitalisation of the demo keeper is being handled here
 */

const setupWallet = async (network) => {
  const wallet = new Wallet('/wallet/jsonpassword.txt', '/wallet/testwallet.json');
  const jsonWallet = await wallet.getWallet();
  console.log('Initializing ', jsonWallet);
  const signer = new ethers.Wallet(jsonWallet, network.provider);
  return signer;
};

let _this;
export default class keeper {
  _clippers = [];
  _wallet = null;
  _uniswapCalleeAdr = null;
  _oasisCalleeAdr = null;
  _gemJoinAdapter = null;
  _activeAuctions = null;

  constructor(net) {
    let config;
    switch (net) {
      case 'kovan':
        config = kovanConfig;
        break;
      case 'mainnet':
        config = mainnetConfig;
        break;
      default:
        config = kovanConfig;
    }

    Config.vars = config;
    network.rpcURL = config.rpcURL;
    _this = this;
  }

  // Check if there's an opportunity in Uniswap & OasisDex to profit with a LIQ2.0 flash loan
  async _opportunityCheck(collateral, oasis, uniswap, clip) {
    console.log('Checking auction opportunities for ' + collateral.name);

    await oasis.fetch();
    this._activeAuctions = await clip.activeAuctions();
    // Fetch the orderbook from OasisDex & all the active auctions
    console.log(`Active auctions qty: ${this._activeAuctions.length}`);

    if (this._activeAuctions.length === 0) console.log('NO ACTIVE AUCTIONS');


    // Look through the list of active auctions
    for (let i = 0; i < this._activeAuctions.length; i++) {
      let auction = this._activeAuctions[i];

      //Redo auction if it's outdated
      await clip.auctionStatus(auction.id, this._wallet.address, this._wallet);
      this._activeAuctions = await clip.activeAuctions();
      auction = this._activeAuctions[i];

      try {
        const lot = (auction.lot.toString());
        // Pass in the entire auction size into Uniswap and store the Dai proceeds form the trade
        await uniswap.fetch(lot);
        // Find the minimum effective exchange rate between collateral/Dai
        // e.x. ETH price 1000 DAI -> minimum profit of 1% -> new ETH price is 1000*1.01 = 1010
        let minProfitPercentage = ethers.utils.parseEther(Config.vars.minProfitPercentage);
        const decimals9 = BigNumber.from('1000000000');
        const decimal18 = ethers.utils.parseEther('1');
        const decimals27 = ethers.utils.parseEther('1000000000');


        const tab = auction.tab.div(decimal18);
        const calcMinProfit45 = tab.mul(minProfitPercentage);
        const totalMinProfit45 = calcMinProfit45.sub(auction.tab);
        const minProfit = totalMinProfit45.div(decimals27);

        let calc = auction.price.mul(minProfitPercentage);
        let priceWithProfit = calc.div(decimal18);
        let auctionPrice = priceWithProfit.mul(auction.lot).div(decimals27);

        // Find the amount of collateral that maximizes the amount of profit captured
        let oasisDexAvailability = oasis.opportunity(calc.div(decimals27));

        // Return the proceeds from the Uniswap market trade; proceeds were queried in uniswap.fetch()
        let uniswapProceeds = uniswap.opportunity();

        // Determine how much collateral we can trade on OasisDex
        const oasisSize = oasisDexAvailability.gt(auction.lot)
          ? auction.lot
          : oasisDexAvailability;

        //TODO: Determine if we already have a pending bid for this auction

        console.log(`\n
            Auction id: # ${auction.id}

            Auction Tab: ${ethers.utils.formatUnits(auction.tab.div(decimals27))}
            Gem price with profit: ${ethers.utils.formatUnits(priceWithProfit.div(decimals9))}

            Dai Proceeds from a full sell on Uniswap: ${uniswapProceeds.receiveAmount} Dai

            OasisDEXAvailability: amt of collateral avl to buy ${ethers.utils.formatEther(oasisDexAvailability)}
            OasisDEX auction buy amt: ${ethers.utils.formatUnits(oasisSize)}

            amt - lot: ${ethers.utils.formatUnits(auction.lot)}
            maxPrice - auction gem price: ${ethers.utils.formatUnits(auction.price.div(decimals9))} Dai
            minProfit: ${ethers.utils.formatUnits(minProfit)} Dai
            profitAddr: ${this._wallet.address}
            gemJoinAdapter: ${this._gemJoinAdapter}
            signer ${this._wallet._isSigner}\n`);

        switch (Config.vars.liquidityProvider) {
          case 'uniswap':
            await clip.execute(auction.id, auction.lot, auction.price, minProfit, this._wallet.address, this._gemJoinAdapter, this._wallet, this._uniswapCalleeAdr);
            break;
          case 'oasisdex':
            await clip.execute(auction.id, auction.lot, auction.price, minProfit, this._wallet.address, this._gemJoinAdapter, this._wallet, this._oasisCalleeAdr);
            break;
          default:
            console.log('Using Uniswap as default auction liquidity provider');
            await clip.execute(auction.id, auction.lot, auction.price, minProfit, this._wallet.address, this._gemJoinAdapter, this._wallet, this._uniswapCalleeAdr);
        }
        this._activeAuctions = await clip.activeAuctions();
      } catch (error) {
        console.error(error);
      }
    }
    //Check for any received tips from redoing auctions
    await checkVatBalance(this._wallet);
  }

  // Initialize the Clipper, OasisDex, and Uniswap JS wrappers
  async _clipperInit(collateral) {
    this._uniswapCalleeAdr = collateral.uniswapCallee;
    this._oasisCalleeAdr = collateral.oasisCallee;
    this._gemJoinAdapter = collateral.joinAdapter;
    // construct the oasis contract method
    const oasis = new oasisDexAdaptor(
      collateral.erc20addr,
      collateral.oasisCallee
    );

    // construct the uniswap contract method
    const uniswap = new UniswapAdaptor(
      collateral.erc20addr,
      collateral.uniswapCallee
    );

    // construct the clipper contract method
    const clip = new Clipper(collateral.name);

    //get the oasis
    await oasis.fetch();

    // inititalize Clip
    await clip.init();

    // await this._opportunityCheck(collateral, oasis, uniswap, clip);
    // return { oasis, uniswap, clip };

    // Initialize the loop where an opportunity is checked at a perscribed cadence (Config.delay)
    const timer = setInterval(() => {
      this._opportunityCheck(collateral, oasis, uniswap, clip);
    }, Config.vars.delay * 1000);
    return { oasis, uniswap, clip, timer };

  }

  async run() {
    this._wallet = await setupWallet(network);
    for (const name in Config.vars.collateral) {
      if (Object.prototype.hasOwnProperty.call(Config.vars.collateral, name)) {
        const collateral = Config.vars.collateral[name];

        //Check for clipper allowance
        await clipperAllowance(collateral.clipper, this._wallet);

        /* The pair is the clipper, oasisdex and uniswap JS Wrappers
         ** Pair Variables definition
         * oasis : oasisDexAdaptor
         * uniswap : UniswapAdaptor
         * clip : Clipper
         * time : NodeJS.Timeout
         */
        this._clipperInit(collateral).then((pair) => {
          // add the pair to the array of clippers
          this._clippers.push(pair);
          console.log(`\n------------------ COLLATERAL ${collateral.name} INITIALIZED ------------------\n`);
        });
      }
    }
  }

  stop() {
    this._clippers.forEach((tupple) => {
      clearTimeout(tupple.timer);
    });
  }
}
