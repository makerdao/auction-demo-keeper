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
  if (passwordPath && JSONKeystorePath) {
    const wallet = new Wallet(passwordPath, JSONKeystorePath);
    const jsonWallet = await wallet.getWallet();
    console.log('Initializing ', jsonWallet);
    const signer = new ethers.Wallet(jsonWallet, network.provider);
    return signer;
  } else {
    return null;
  }
};

let _this;
export default class keeper {
  _clippers = [];
  _wallet = null;
  _uniswapCalleeAdr = null;
  _uniswapLPCalleeAdr = null;
  _oasisCalleeAdr = null;
  _gemJoinAdapters = {};
  _activeAuctions = null;
  _processingFlags = {};

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
    if (this._processingFlags[collateral]) {
      console.debug('Already processing opportunities for ' + collateral.name);
    } else {
      console.log('Checking auction opportunities for ' + collateral.name);
      this._processingFlags[collateral] = true;
    }

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
        if (this._wallet) {
          const redone = await clip.auctionStatus(auction.id, this._wallet.address, this._wallet);
          if (redone)
            continue;
        }

        const decimals9 = BigNumber.from('1000000000');
        const decimals18 = ethers.utils.parseEther('1');
        const decimals27 = ethers.utils.parseEther('1000000000');

        let minProfitPercentage = ethers.utils.parseEther(Config.vars.minProfitPercentage);
        let priceWithProfit = auction.price.div(minProfitPercentage).mul(decimals18);

        // Determine configured lot sizes in Gem terms
        let minLotDaiValue = ethers.utils.parseEther(Config.vars.minLotDaiValue).mul(decimals18);
        let minLot = minLotDaiValue.div(auction.price.div(decimals9));
        let maxLotDaiValue = ethers.utils.parseEther(Config.vars.maxLotDaiValue).mul(decimals18);
        let maxLot = maxLotDaiValue.div(auction.price.div(decimals9));

        //adjust lot based upon slice taken at the current auction price
        let slice18 = auction.lot.gt(maxLot) ? maxLot : auction.lot;
        let owe27 = slice18.mul(auction.price).div(decimals18);
        let tab27 = auction.tab.div(decimals18);
        // adjust covered debt to tab, such that slice better reflects amount of collateral we'd receive
        if (owe27.gt(tab27) && slice18.gt(auction.lot)) {
          owe27 = tab27;
          slice18 = owe27.div(auction.price.div(decimals18));
        } else if (owe27.lt(tab27) && slice18.lt(auction.lot)) {
          let chost27 = clip._chost.div(decimals18);
          if (tab27.sub(owe27).lt(chost27)) {
            if (tab27.lte(chost27)) {
              // adjust the penultimate take to avoid partial lot on the final take
              owe27 = tab27.sub(chost27);
            } else {
              // adjust to chost
              owe27 = chost27;
            }

            slice18 = owe27.div(auction.price.div(decimals18));
          }
          if (slice18.gt(maxLot)) {  // handle corner case where maxLotDaiValue is set too low
            console.log(`Ignoring auction ${auction.id} whose chost-adjusted slice of ${ethers.utils.formatUnits(slice18)} exceeds our maximum lot of ${ethers.utils.formatUnits(maxLot)}\n`);
            continue;
          }
        }
        if (slice18.gt(auction.lot)) {
          // HACK: I suspect the issue involves interplay between reading price from the abacus and not having multicall.
          slice18 = auction.lot;
        }
        let lot = slice18;
        if (lot.lt(minLot)) {
          console.log(`Ignoring auction ${auction.id} while slice is smaller than our minimum lot\n`);
          // slice approaches lot as auction price decreases towards owe == tab
          continue;
        }

        // Find the minimum effective exchange rate between collateral/Dai
        // e.x. ETH price 1000 DAI -> minimum profit of 1% -> new ETH price is 1000*1.01 = 1010
        const calcMinProfit45 = owe27.mul(minProfitPercentage);
        const totalMinProfit45 = calcMinProfit45.sub(owe27.mul(decimals18));
        const minProfit = totalMinProfit45.div(decimals27);
        const costOfLot = priceWithProfit.mul(lot).div(decimals27);

        // Find the amount of collateral that maximizes the amount of profit captured
        let oasisDexAvailability;
        if (oasis)
          oasisDexAvailability = oasis.opportunity(priceWithProfit.div(decimals9));

        // Determine proceeds from swapping gem for Dai on Uniswap
        let uniswapProceeds;
        let minUniProceeds;
        if (uniswap) {
          uniswapProceeds = await uniswap.fetch(lot);
          minUniProceeds = Number(uniswapProceeds.receiveAmount) - Number(ethers.utils.formatUnits(minProfit));
        }

        const auctionSummary = `\n
          ${collateral.name} auction ${auction.id}

            Auction Tab:        ${ethers.utils.formatUnits(auction.tab.div(decimals27))} Dai
            Auction Lot:        ${ethers.utils.formatUnits(auction.lot.toString())}
            Configured Lot:     between ${ethers.utils.formatUnits(minLot)} and ${ethers.utils.formatUnits(maxLot)}
            Debt to Cover:      ${ethers.utils.formatUnits(owe27.div(decimals9))} Dai
            Slice to Take:      ${ethers.utils.formatUnits(lot)}
            Auction Price:      ${ethers.utils.formatUnits(auction.price.div(decimals9))} Dai

            Cost of lot:        ${ethers.utils.formatUnits(costOfLot)} Dai
            Minimum profit:     ${ethers.utils.formatUnits(minProfit)} Dai\n`;

        let liquidityAvailability;
        if (uniswap) {
          liquidityAvailability = `
            Uniswap proceeds:   ${uniswapProceeds.receiveAmount} Dai
            Less min profit:    ${minUniProceeds}\n`;
          console.log(auctionSummary + liquidityAvailability);
          if (Number(ethers.utils.formatUnits(costOfLot)) <= minUniProceeds) {
            //Uniswap tx executes only if the return amount also covers the minProfit %
            await clip.execute(
              auction.id,
              lot,
              auction.price,
              minProfit,
              this._wallet.address,
              this._gemJoinAdapters[collateral.name],
              this._wallet,
              uniswap._callee.address
            );
          } else {
            console.log('Uniswap proceeds - profit amount is less than cost.\n');
          }

        } else if (oasis) {
          liquidityAvailability = `
            Gem price with profit: ${ethers.utils.formatUnits(priceWithProfit.div(decimals9))}
            OasisDEXAvailability:  amt of collateral avl to buy ${ethers.utils.formatUnits(oasisDexAvailability)}\n`;
          console.log(auctionSummary + liquidityAvailability);
          //OasisDEX buys gem only with gem price + minProfit%
          if (oasisDexAvailability.gt(auction.lot)) {
            await clip.execute(
              auction.id,
              lot,
              auction.price,
              minProfit,
              this._wallet.address,
              this._gemJoinAdapters[collateral.name],
              this._wallet,
              oasis._callee.address
            );
          } else {
            console.log('Not enough liquidity on OasisDEX\n');
          }
        }

        this._activeAuctions = await clip.activeAuctions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      this._processingFlags[collateral] = false;
    }
    //Check for any received tips from redoing auctions
    // FIXME - this will fire multiple times for each collateral type
    //await checkVatBalance(this._wallet);
  }

  // Initialize the Clipper, OasisDex, and Uniswap JS wrappers
  async _clipperInit(collateral) {
    this._uniswapCalleeAdr = collateral.uniswapCallee;
    this._uniswapLPCalleeAdr = collateral.uniswapLPCallee;
    this._oasisCalleeAdr = collateral.oasisCallee;
    this._gemJoinAdapters[collateral.name] = collateral.joinAdapter;

    // construct the oasis contract method
    const oasis = collateral.oasisCallee ? new oasisDexAdaptor(
      collateral.erc20addr,
      collateral.oasisCallee,
      collateral.name
    ) : null;

    // construct the uniswap contract method
    const uniswap = (collateral.uniswapCallee || collateral.uniswapLPCallee) ?
      new UniswapAdaptor(
        collateral.erc20addr,
        collateral.uniswapCallee ?
          collateral.uniswapCallee : collateral.uniswapLPCallee,
        collateral.name
      ) : null;

    // construct the clipper contract method
    const clip = new Clipper(collateral.name);

    // inititalize Clip
    await clip.init();

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
        if (this._wallet) {
          await clipperAllowance(collateral.clipper, this._wallet);
          await daiJoinAllowance(Config.vars.daiJoin, this._wallet);
        }

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
