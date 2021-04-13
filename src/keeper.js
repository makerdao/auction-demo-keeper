/* eslint-disable no-unused-vars */
import oasisDexAdaptor from './dex/oasisdex.js';
import kovanConfig from '../config/kovan.json';
import Config from './singleton/config.js';
import network from './singleton/network.js';
import Clipper from './clipper.js';
import { ethers, BigNumber } from 'ethers';
import UniswapAdaptor from './dex/uniswap.js';
import Wallet from './wallet.js';
import clipperAllowance from './vat.js';

/* The Keeper module is the entry point for the
 ** auction Demo Keeper
 * all configurations and intitalisation of the demo keeper is being handled here
 */

const setupWallet = async (network) => {
  const wallet = new Wallet('/wallet/jsonpassword.txt', '/wallet/testwallet.json');
  const jsonWallet = await wallet.getWallet();
  console.log('wallet', jsonWallet);
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

  constructor(rpcUrl, net) {
    let config;
    switch (net) {
      case 'kovan':
        config = kovanConfig;
        break;
      default:
        config = kovanConfig;
    }

    config.rpcURL = rpcUrl;
    Config.vars = config;
    network.rpcURL = rpcUrl;
    _this = this;
  }

  // Check if there's an opportunity in Uniswap & OasisDex to profit with a LIQ2.0 flash loan
  async _opportunityCheck(collateral, oasis, uniswap, clip) {
    console.log('Check auction opportunities for ' + collateral.name);

    await oasis.fetch();
    this._activeAuctions = await clip.activeAuctions();
    // Fetch the orderbook from OasisDex & all the active auctions
    console.log('Active auctions qty: ' + this._activeAuctions.length);


    // Look through the list of active auctions
    for (let i = 0; i < this._activeAuctions.length; i++) {
      let auction = this._activeAuctions[i];

      //Redo auction if it's outdated
      await clip.auctionStatus(auction.id, this._wallet.address, this._wallet);
      this._activeAuctions = await clip.activeAuctions();
      auction = this._activeAuctions[i];

      try {
        console.log('Auction Gem Price ', auction.price.toString());
        console.log('Auction Tab:', auction.tab.toString());
        const lot = (auction.lot.toString());
        console.log('Auction lot value: ', lot);
        // Pass in the entire auction size into Uniswap and store the Dai proceeds form the trade
        await uniswap.fetch(lot);
        // Find the minimum effective exchange rate between collateral/Dai
        // e.x. ETH price 1000 DAI -> minimum profit of 1% -> new ETH price is 1000*1.01 = 1010
        console.log('auction: ', auction.price.toString());
        let minProfitPercentage = ethers.utils.parseEther(Config.vars.minProfitPercentage);
        const decimal18 = ethers.utils.parseEther('1');
        const decimals27 = ethers.utils.parseEther('1000000000');


        const tab = auction.tab.div(decimal18);
        const calcMinProfit45 = tab.mul(minProfitPercentage);
        const totalMinProfit45 = calcMinProfit45.sub(auction.tab);
        const minProfit = totalMinProfit45.div(decimals27);

        let calc = auction.price.mul(minProfitPercentage);
        let priceWithProfit = calc.div(decimal18);
        let auctionPrice = priceWithProfit.mul(auction.lot).div(decimals27);


        console.log('Price with profit ', priceWithProfit.toString());
        console.log('Total auction price: ', auctionPrice.toString());
        console.log('MinProfit earning :', minProfit.toString());

        // Find the amount of collateral that maximizes the amount of profit captured
        console.log('collateral price with profit% for oasis: ', calc.div(decimals27).toString());
        let oasisDexAvailability = oasis.opportunity(calc.div(decimals27));
        console.log('OasisDEXAvailability: amt of collateral avl to buy ', ethers.utils.formatEther(oasisDexAvailability));

        // Return the proceeds from the Uniswap market trade; proceeds were queried in uniswap.fetch()
        let uniswapProceeds = uniswap.opportunity();
        console.log('Uniswap Proceeds: ', uniswapProceeds.receiveAmount);

        // Determine how much collateral we can trade on OasisDex
        const oasisSize = oasisDexAvailability.gt(auction.lot)
          ? auction.lot
          : oasisDexAvailability;

        // const auctionSale = auction.price.mul(auction.lot).div(decimals27);
        // console.log('auctionSale: ', auctionSale.toString());
        // const totalMinProfit = priceWithProfit.mul(auction.lot).div(decimals27);
        // console.log('totalMinProfit: ', totalMinProfit.toString());
        // const minProfit = totalMinProfit.sub(auctionSale);
        // console.log('minProfit:  ', minProfit.toString());

        console.log(`Auction # ${auction.id} \n
            Current price: ${auction.price}, \n
            Dai Proceeds from a full sell on Uniswap: ${uniswapProceeds.receiveAmount}
            Profitable collateral in OasisDex: ${ethers.utils.formatUnits(oasisSize)}`);

        //TODO: Determine if we already have a pending bid for this auction

        // Check if there's a Dai profit from Uniswap by selling the entire auction
        //Clipper.execute(auction.id, _amt, _maxPrice, _minProfit, _profitAddr, _gemA, _signer, exchangeCalleeAddress)

        // if (
        //   uniswapProceeds.receiveAmount > ethers.utils.formatUnits(totalMinProfit)
        // ) {
        console.log(`Auction id: # ${auction.id} \n
            amt - lot: ${auction.lot}, \n
            maxPrice - price: ${auction.price}, \n
            minProfit: ${minProfit} \n
            _profitAddr: ${this._wallet.address} \n
            _gemJoinAdapter: ${this._gemJoinAdapter} \n
            _signer ${this._wallet._isSigner} \n
            exchangeCalleeAddress: ${this._uniswapCalleeAdr}`);
        //clip.execute(auctionId, _amt, _maxPrice, _minProfit, _profitAddr, _gemJoinAdapter, _signer, exchangeCalleeAddress)
        // _minProfit - priceWithProfit.mul(auction.lot) - minimum amount of total Dai to receive from exchange. 
        // await clip.execute(auction.id, auction.lot, auction.price, minProfit, this._wallet.address, this._gemJoinAdapter, this._wallet, this._uniswapCalleeAdr);

        // If there's not a profit from Uniswap, use Oasis to sell a portion of
        // the collateral that maximizes the Dai profit
        // } else if (oasisSize > 0) {
        //   //check the collateral clipper and call execute function with the right auction id
        await clip.execute(auction.id, auction.lot, auction.price, minProfit, this._wallet.address, this._gemJoinAdapter, this._wallet, this._oasisCalleeAdr);
        // }
      } catch (error) {
        console.error(error);
      }
    }
  }

  // Initialize the Clipper, OasisDex, and Uniswap JS wrappers
  async _clipperInit(collateral) {
    this._uniswapCalleeAdr = collateral.uniswapCallee;
    this._oasisCalleeAdr = collateral.oasisCallee;
    this._gemJoinAdapter = collateral.joinAdapter;
    console.log('this._gemJoinAdapter', this._gemJoinAdapter);
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

    // Initialize the loop where an opportunity is checked at a perscribed cadence (Config.delay)
    // const timer = setInterval(() => {
    //   this._opportunityCheck(collateral, oasis, uniswap, clip);
    // }, Config.vars.delay * 1000);
    await this._opportunityCheck(collateral, oasis, uniswap, clip);
    return { oasis, uniswap, clip };
    // return { oasis, uniswap, clip, timer };
  }

  async run() {
    this._wallet = await setupWallet(network);
    for (const name in Config.vars.collateral) {
      if (Object.prototype.hasOwnProperty.call(Config.vars.collateral, name)) {
        const collateral = Config.vars.collateral[name];
        console.log('Collateral: ', collateral);

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
          console.log('Collateral ' + collateral.name + ' initialized');
        });
      }
    }
    console.log('This _clippers Array: ', this._clippers);
  }

  stop() {
    this._clippers.forEach((tupple) => {
      clearTimeout(tupple.timer);
    });
  }
}
