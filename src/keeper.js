/* eslint-disable complexity */
/* eslint-disable no-unused-vars */
import oasisDexAdaptor from './dex/oasisdex.js';
import Config from './singleton/config.js';
import network from './singleton/network.js';
import Clipper from './clipper.js';
import { ethers, BigNumber } from 'ethers';
import UniswapAdaptor from './dex/uniswap.js';
import Wallet from './wallet.js';
import { clipperAllowance, checkVatBalance, daiJoinAllowance } from './vat.js';
import fs from 'fs';

/* The Keeper module is the entry point for the
 ** auction Demo Keeper
 * all configurations and intitalisation of the demo keeper is being handled here
 */

const setupWallet = async (network, passwordPath, JSONKeystorePath) => {
  const wallet = new Wallet(passwordPath, JSONKeystorePath);
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
  _gemJoinAdapters = {};
  _activeAuctions = null;

  constructor(configPath, walletPasswordPath, walletKeystorePath) {
    let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    Config.vars = config;
    network.rpcURL = config.rpcURL;
    this.walletPasswordPath = walletPasswordPath;
    this.walletKeystorePath = walletKeystorePath;
    _this = this;
  }

  // Check if there's an opportunity in Uniswap & OasisDex to profit with a LIQ2.0 flash loan
  async _opportunityCheck(collateral, oasis, uniswap, clip) {
    console.log('Checking auction opportunities for ' + collateral.name);

    if (oasis)  // Oasis liquidity check doesn't depend on auction lot size
      await oasis.fetch();

    this._activeAuctions = await clip.activeAuctions();
    // Fetch the orderbook from OasisDex & all the active auctions
    console.log(`${collateral.name} Active auctions qty: ${this._activeAuctions.length}`);

    try {
      // Look through the list of active auctions
      for (let i = 0; i < this._activeAuctions.length; i++) {
        let auction = this._activeAuctions[i];

        // Redo auction if it ended without covering tab or lot
        const redone = await clip.auctionStatus(auction.id, this._wallet.address, this._wallet);
        if (redone)
          continue;

        const decimals9 = BigNumber.from('1000000000');
        const decimal18 = ethers.utils.parseEther('1');
        const decimals27 = ethers.utils.parseEther('1000000000');
        let minProfitPercentage = ethers.utils.parseEther(Config.vars.minProfitPercentage);

        const tab = auction.tab.div(decimal18);
        let calc = auction.price.mul(minProfitPercentage);
        let priceWithProfit = calc.div(decimal18);


        //adjusting lot to lotDaiValue
        let lotDaiValue = ethers.utils.parseEther(Config.vars.lotDaiValue).mul(decimal18);
        let minLot = lotDaiValue.div(auction.price.div(decimals9));
        let lot;

        //checking for partial lot condition
        let chost = clip._chost;
        if (tab - lotDaiValue < chost) {
          lot = auction.lot;
        } else {
          lot = minLot;
        }

        // Pass in the entire auction size into Uniswap and store the Dai proceeds form the trade
        if (uniswap)
          await uniswap.fetch(lot);
        // Find the minimum effective exchange rate between collateral/Dai
        // e.x. ETH price 1000 DAI -> minimum profit of 1% -> new ETH price is 1000*1.01 = 1010

        const calcMinProfit45 = tab.mul(minProfitPercentage);
        const totalMinProfit45 = calcMinProfit45.sub(auction.tab);
        const minProfit = totalMinProfit45.div(decimals27);
        const costOfLot = priceWithProfit.mul(lot).div(decimals27);


        // Find the amount of collateral that maximizes the amount of profit captured
        let oasisDexAvailability
        if (oasis)
          oasisDexAvailability = oasis.opportunity(priceWithProfit.div(decimals9));

        // Return the proceeds from the Uniswap market trade; proceeds were queried in uniswap.fetch()
        let uniswapProceeds
        let minUniProceeds;
        if (uniswap) {
          uniswapProceeds = uniswap.opportunity();
          minUniProceeds = Number(uniswapProceeds.receiveAmount) - (Number(ethers.utils.formatUnits(minProfit)));
        }

        //TODO: Determine if we already have a pending bid for this auction

        const auctionSummary = `\n
          ${collateral.name} auction ${auction.id}
    
            Auction Tab:           ${ethers.utils.formatUnits(auction.tab.div(decimals27))}
            Auction Lot:           ${ethers.utils.formatUnits(auction.lot.toString())}
            Auction Price:         ${ethers.utils.formatUnits(auction.price.div(decimals9))}
            Min profit:            ${ethers.utils.formatUnits(minProfit)}
            Gem price with profit: ${ethers.utils.formatUnits(priceWithProfit.div(decimals9))}
    
            Lot sale amt - lot: ${ethers.utils.formatUnits(lot)}
            costOfLot: ${ethers.utils.formatUnits(costOfLot)}
            maxPrice   ${ethers.utils.formatUnits(auction.price.div(decimals9))} Dai
            minProfit: ${ethers.utils.formatUnits(minProfit)} Dai
            profitAddr: ${this._wallet.address}\n`;

        let liquidityAvailability;
        if (uniswap) {
          liquidityAvailability = `
            Dai Proceeds from Uniswap sale: ${uniswapProceeds.receiveAmount} Dai
            Proceeds - minProfit:           ${minUniProceeds}\n`
          console.log(auctionSummary + liquidityAvailability);
          if (Number(ethers.utils.formatUnits(costOfLot)) <= minUniProceeds) {
            //Uniswap tx executes only if the return amount also covers the minProfit %
            await clip.execute(auction.id, lot, auction.price, minProfit, this._wallet.address, this._gemJoinAdapters[collateral.name], this._wallet, this._uniswapCalleeAdr);
          } else {
            console.log('Uniswap proceeds - profit amount is less than cost.\n');
          }

        } else if (oasis) {
          liquidityAvailability = `
            OasisDEXAvailability: amt of collateral avl to buy ${ethers.utils.formatUnits(oasisDexAvailability)}\n`
          console.log(auctionSummary + liquidityAvailability);
          //OasisDEX buys gem only with gem price + minProfit%
          if (oasisDexAvailability.gt(auction.lot)) {
            await clip.execute(auction.id, lot, auction.price, minProfit, this._wallet.address, this._gemJoinAdapters[collateral.name], this._wallet, this._oasisCalleeAdr);
          } else {
            console.log('Not enough liquidity on OasisDEX\n');
          }
        }

        this._activeAuctions = await clip.activeAuctions();
      }
    } catch (e) {
      console.error(e);
    }
    //Check for any received tips from redoing auctions
    // FIXME - this will fire multiple times for each collateral type
    //await checkVatBalance(this._wallet);
  }

  // Initialize the Clipper, OasisDex, and Uniswap JS wrappers
  async _clipperInit(collateral) {
    this._uniswapCalleeAdr = collateral.uniswapCallee;
    this._oasisCalleeAdr = collateral.oasisCallee;
    this._gemJoinAdapters[collateral.name] = collateral.joinAdapter;
    // construct the oasis contract method
    const oasis = collateral.oasisCallee ? new oasisDexAdaptor(
      collateral.erc20addr,
      collateral.oasisCallee,
      collateral.name
    ) : null;

    // construct the uniswap contract method
    const uniswap = collateral.uniswapCallee ? new UniswapAdaptor(
      collateral.erc20addr,
      collateral.uniswapCallee,
      collateral.name
    ) : null;

    // construct the clipper contract method
    const clip = new Clipper(collateral.name);

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
    this._wallet = await setupWallet(network, this.walletPasswordPath, this.walletKeystorePath);
    for (const name in Config.vars.collateral) {
      if (Object.prototype.hasOwnProperty.call(Config.vars.collateral, name)) {
        const collateral = Config.vars.collateral[name];

        //Check for clipper allowance
        await clipperAllowance(collateral.clipper, this._wallet);
        await daiJoinAllowance(Config.vars.daiJoin, this._wallet);

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
