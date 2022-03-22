/* eslint-disable complexity */
/* eslint-disable no-unused-vars */
import Config from './singleton/config.js';
import network from './singleton/network.js';
import Clipper from './clipper.js';
import { ethers, BigNumber } from 'ethers';
import oasisDexAdaptor from './dex/oasisdex.js';
import UniswapV2Adapter from './dex/uniswapv2.js';
import UniswapV3Adaptor from './dex/uniswapv3.js';
import WstETHCurveUniv3Adaptor from './dex/wstETHCurveUniv3.js';
import LpCurveUniv3Adaptor from './dex/lpCurveUniv3.js';
import TusdCurveAdaptor from './dex/tusdCurve.js';
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
  _uniswapV2CalleeAddr = null;
  _uniswapLPCalleeAddr = null;
  _uniswapV3CalleeAddr = null;
  _oasisCalleeAddr = null;
  _wstETHCurveUniv3CalleeAddr = null;
  _lpCurveUniv3CalleeAddr = null;
  _tusdCurveCalleeAddr = null;
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
  async _opportunityCheck(collateral, oasis, uniswap, wstETHCurveUniv3, uniswapV3, lpCurveUniv3, tusdCurve, clip) {
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
        if (owe27.gt(tab27)) {
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
          owe27 = slice18.mul(auction.price).div(decimals18);
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

        const debtToCover = owe27.div(decimals9);

        // Find the amount of collateral that maximizes the amount of profit captured
        let oasisDexAvailability;
        if (oasis)
          oasisDexAvailability = oasis.opportunity(priceWithProfit.div(decimals9));

        // Determine proceeds from swapping gem for Dai on Uniswap
        let uniswapV2Proceeds;
        let minUniV2Proceeds;
        if (uniswap) {
          uniswapV2Proceeds = await uniswap.fetch(lot);
          minUniV2Proceeds = Number(uniswapV2Proceeds.receiveAmount) - Number(ethers.utils.formatUnits(minProfit));
        }

        // Determine proceeds from swapping gem for Dai on Uniswap v3
        let uniswapV3Proceeds;
        let minUniV3Proceeds;
        if (uniswapV3) {
          uniswapV3Proceeds = await uniswapV3.fetch(lot);
          minUniV3Proceeds = Number(uniswapV3Proceeds.receiveAmount) - Number(ethers.utils.formatUnits(minProfit));
        }

        // Determine proceeds from swapping WSTETH => STETH => ETH => Dai
        let wstETHCurveUniv3Proceeds;
        let minWstETHCurveUniv3Proceeds;
        if (wstETHCurveUniv3) {
          wstETHCurveUniv3Proceeds = await wstETHCurveUniv3.fetch(lot);
          minWstETHCurveUniv3Proceeds = Number(wstETHCurveUniv3Proceeds.receiveAmount) -
                                        Number(ethers.utils.formatUnits(minProfit));
        }

        // Determine proceeds from swapping Curve LP tokens through Curve and then Uniswap
        let lpCurveUniv3Proceeds;
        let minLpCurveUniv3Proceeds;
        if (lpCurveUniv3) {
          lpCurveUniv3Proceeds = await lpCurveUniv3.fetch(lot);
          minLpCurveUniv3Proceeds = Number(lpCurveUniv3Proceeds.receiveAmount) -
                                    Number(ethers.utils.formatUnits(minProfit));
        }

        // Determine proceeds from swapping TUSD on Curve
        let tusdCurveProceeds;
        let minTusdCurveProceeds;
        if (tusdCurve) {
          tusdCurveProceeds = await tusdCurve.fetch(lot);
          minTusdCurveProceeds = Number(tusdCurveProceeds.receiveAmount) -
              Number(ethers.utils.formatUnits(minProfit));
        }

        const auctionSummary = `\n
          ${collateral.name} auction ${auction.id}

            Auction Tab:        ${ethers.utils.formatUnits(auction.tab.div(decimals27))} Dai
            Auction Lot:        ${ethers.utils.formatUnits(auction.lot.toString())}
            Configured Lot:     between ${ethers.utils.formatUnits(minLot)} and ${ethers.utils.formatUnits(maxLot)}
            Slice to Take:      ${ethers.utils.formatUnits(lot)}
            Auction Price:      ${ethers.utils.formatUnits(auction.price.div(decimals9))} Dai

            Debt to Cover:      ${ethers.utils.formatUnits(debtToCover)} Dai
            Minimum profit:     ${ethers.utils.formatUnits(minProfit)} Dai\n`;

        // Increase actual take amount to account for rounding errors and edge cases.
        // Do not increase too much to not significantly go over configured maxAmt.
        const amt = lot.mul(1000001).div(1000000);

        let liquidityAvailability;
        if (uniswap) {
          liquidityAvailability = `
            Uniswap proceeds:   ${uniswapV2Proceeds.receiveAmount} Dai
            Less min profit:    ${minUniV2Proceeds}\n`;
          console.log(auctionSummary + liquidityAvailability);
          if (Number(ethers.utils.formatUnits(debtToCover)) <= minUniV2Proceeds) {
            // Uniswap tx executes only if the return amount also covers the minProfit %
            await clip.execute(
              auction.id,
              amt,
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
        } else if (uniswapV3) {
          liquidityAvailability = `
            Uniswap V3 proceeds:   ${uniswapV3Proceeds.receiveAmount} Dai
            Less min profit:    ${minUniV3Proceeds}\n`;
          console.log(auctionSummary + liquidityAvailability);
          if (Number(ethers.utils.formatUnits(debtToCover)) <= minUniV3Proceeds) {
            // Uniswap tx executes only if the return amount also covers the minProfit %
            await clip.execute(
              auction.id,
              amt,
              auction.price,
              minProfit,
              this._wallet.address,
              this._gemJoinAdapters[collateral.name],
              this._wallet,
              uniswapV3._callee.address
            );
          } else {
            console.log('Uniswap V3 proceeds - profit amount is less than cost.\n');
          }
        } else if (oasis) {
          liquidityAvailability = `
            Gem price with profit: ${ethers.utils.formatUnits(priceWithProfit.div(decimals9))}
            OasisDEXAvailability:  amt of collateral avl to buy ${ethers.utils.formatUnits(oasisDexAvailability)}\n`;
          console.log(auctionSummary + liquidityAvailability);
          // OasisDEX buys gem only with gem price + minProfit%
          if (oasisDexAvailability.gt(auction.lot)) {
            await clip.execute(
              auction.id,
              amt,
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
        } else if (wstETHCurveUniv3) {
          liquidityAvailability = `
            Uniswap proceeds:   ${wstETHCurveUniv3Proceeds.receiveAmount} Dai
            Less min profit:    ${minWstETHCurveUniv3Proceeds}\n`;
          console.log(auctionSummary + liquidityAvailability);
          if (Number(ethers.utils.formatUnits(debtToCover)) <= minWstETHCurveUniv3Proceeds) {
            // tx executes only if the return amount also covers the minProfit %
            await clip.execute(
                auction.id,
                amt,
                auction.price,
                minProfit,
                this._wallet.address,
                this._gemJoinAdapters[collateral.name],
                this._wallet,
                wstETHCurveUniv3._callee.address
            );
          }
        } else if (lpCurveUniv3) {
          liquidityAvailability = `
          Curve+Univ3 proceeds:   ${lpCurveUniv3Proceeds.receiveAmount} Dai
          Less min profit:    ${minLpCurveUniv3Proceeds}\n`;
          console.log(auctionSummary + liquidityAvailability);
          if (Number(ethers.utils.formatUnits(debtToCover)) <= minLpCurveUniv3Proceeds) {
            // tx executes only if the return amount also covers the minProfit %
            await clip.execute(
                auction.id,
                amt,
                auction.price,
                minProfit,
                this._wallet.address,
                this._gemJoinAdapters[collateral.name],
                this._wallet,
                lpCurveUniv3._callee.address
            );
          } else {
            console.log('lp Curve Univ3 proceeds - profit amount is less than cost.\n');
          }
        } else if (tusdCurve) {
          liquidityAvailability = `
          Curve Tusd Dai proceeds:   ${tusdCurveProceeds.receiveAmount} Dai
          Less min profit:    ${minTusdCurveProceeds}\n`;
          console.log(auctionSummary + liquidityAvailability);
          if (Number(ethers.utils.formatUnits(debtToCover)) <= minTusdCurveProceeds) {
            // tx executes only if the return amount also covers the minProfit %
            await clip.execute(
                auction.id,
                amt,
                auction.price,
                minProfit,
                this._wallet.address,
                this._gemJoinAdapters[collateral.name],
                this._wallet,
                tusdCurve._callee.address
            );
          } else {
            console.log('Curve Tusd proceeds - profit amount is less than cost.\n');
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
    this._uniswapV2CalleeAddr = collateral.uniswapV2Callee;
    this._uniswapV3CalleeAddr = collateral.uniswapV3Callee;
    this._uniswapLPCalleeAddr = collateral.uniswapLPCallee;
    this._oasisCalleeAddr = collateral.oasisCallee;
    this._wstETHCurveUniv3CalleeAddr = collateral.wstETHCurveUniv3Callee;
    this._lpCurveUniv3CalleeAddr = collateral.lpCurveUniv3Callee;
    this._tusdCurveCalleeAddr = collateral.tusdCurveCallee;
    this._gemJoinAdapters[collateral.name] = collateral.joinAdapter;

    // construct the oasis contract method
    const oasis = collateral.oasisCallee ? new oasisDexAdaptor(
      collateral.erc20addr,
      collateral.oasisCallee,
      collateral.name
    ) : null;

    // construct the uniswap contract method
    const uniswap = (collateral.uniswapV2Callee || collateral.uniswapLPCallee) ?
      new UniswapV2Adapter(
        collateral.erc20addr,
        collateral.uniswapV2Callee ?
          collateral.uniswapV2Callee : collateral.uniswapLPCallee,
        collateral.name
      ) : null;

    // construct the uniswap v3 contract method
    const uniswapV3 = collateral.uniswapV3Callee ?
      new UniswapV3Adaptor(
        collateral.uniswapV3Callee,
        collateral.name
      ) : null;

    // construct the wstETH Curve Univ3 contract method
    const wstETHCurveUniv3 = collateral.wstETHCurveUniv3Callee ?
      new WstETHCurveUniv3Adaptor(
          collateral.erc20addr,
          collateral.wstETHCurveUniv3Callee,
          collateral.name
      ) : null;

    // construct the lp Curve Univ3 contract method
    const lpCurveUniv3 = collateral.lpCurveUniv3Callee ?
      new LpCurveUniv3Adaptor(
        collateral.erc20addr,
        collateral.lpCurveUniv3Callee,
        collateral.name
    ) : null;

    // construct the tusd Curve contract method
    const tusdCurve = collateral.tusdCurveCallee ?
      new TusdCurveAdaptor(
        collateral.erc20addr,
        collateral.tusdCurveCallee,
        collateral.name
    ) : null;

    // construct the clipper contract method
    const clip = new Clipper(collateral.name);

    // inititalize Clip
    await clip.init();

    // Initialize the loop where an opportunity is checked at a perscribed cadence (Config.delay)
    const timer = setInterval(() => {
      this._opportunityCheck(
        collateral, oasis, uniswap, wstETHCurveUniv3, uniswapV3, lpCurveUniv3, tusdCurve, clip
      );
    }, Config.vars.delay * 1000);
    return { oasis, uniswap, wstETHCurveUniv3, uniswapV3, lpCurveUniv3, tusdCurve, clip, timer };
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
         * uniswap : UniswapV2Adapter
         * uniswapV3 : UniswapV3Adaptor
         * wstETH Curve Univ3 : WstETHCurveUniv3Adaptor
         * lp Curve Univ3 : LpCurveUniv3Adaptor
         * tusd Curve : TusdCurveAdaptor
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
