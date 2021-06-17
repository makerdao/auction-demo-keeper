/* eslint-disable no-unused-vars */
import network from './singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import Config from './singleton/config.js';
import abacusAbi from '../abi/abacus.json';
import clipperAbi from '../abi/clipper.json';
import { Transact, GeometricGasPrice } from './transact.js';

const decimals9 = BigNumber.from('1000000000');
const decimals18 = ethers.utils.parseEther('1');
const decimals27 = ethers.utils.parseEther('1000000000');

export default class Clipper {
  _collateral;
  _collateralName;
  _clipper;
  _abacus;
  _abacusAddr;
  _activeAuctions = [];
  _chost;

  _kickListener;
  _takeListener;
  _redoListener;

  constructor(ilkType) {
    const collInfo = Config.vars.collateral[ilkType];
    this._collateralName = ilkType;
    this._clipperAddr = collInfo.clipper;
    this._collateral = collInfo.erc20addr;

    //TODO: start timer every minute
  }

  // Initialize the clipper
  async init() {

    // initialize the clipper contract object
    this._clipper = new ethers.Contract(this._clipperAddr, clipperAbi, network.provider);

    // _clipper.calc() returns the abacus address of the collateral
    this._abacusAddr = await this._clipper.calc();

    //chost = ilk.dust * ilk.chop(liquidation penalty)
    this._chost = await this._clipper.chost();

    // initialize the abacus contract obbject
    this._abacus = new ethers.Contract(this._abacusAddr, abacusAbi, network.provider);

    // Listen for active auctions
    this._kickListener = this._clipper.on('Kick', (id, top, tab, lot, usr, kpr, coin, event) => {
      console.log(`Vault ${usr} has been kicked`);
      network.provider.getBlock(event.blockNumber).then(block => {
        const tic = block.timestamp;
        this._activeAuctions[id] = { top, tab, lot, id, usr, tic, kpr, coin };
      });
    });

    // eslint-disable-next-line no-unused-vars

    // Based on the auction state, get the collateral remaining in auction or delete auction
    this._takeListener = this._clipper.on('Take', (id, max, price, owe, tab, lot, usr, event) => {
      if (lot.eq(0) || tab.eq(0)) {
        // Auction is over
        console.log(`Deleting Auction ID: ${id.toString()} with remaining tab ${ethers.utils.formatUnits(tab.div(decimals27))} and lot ${ethers.utils.formatUnits(lot)}`);
        delete (this._activeAuctions[id]);
      } else {
        // Collateral remaining in auction
        console.log('Updating taken auction data: ', id.toString());
        const arr = this._activeAuctions.map(obj => ({
          ...obj
        }));
        arr[id].lot = lot;
        arr[id].tab = tab;
        this._activeAuctions = arr;
      }
    });
    // recall the listener to check for active auctions
    this._redoListener = this._clipper.on('Redo', (id, top, tab, lot, usr, event) => {
      console.log('Updating redone auction ', id.toString());
      network.provider.getBlock(event.blockNumber).then(block => {
        const tic = block.timestamp;
        const arr = this._activeAuctions.map(obj => ({
          ...obj
        }));
        arr[id].top = top;
        arr[id].tic = tic;
        this._activeAuctions = arr;
      });
    });

    //Load the active auctions
    const auctionsIds = await this._clipper.list();
    const readPromises = [];
    for (let id = 0; id <= auctionsIds.length - 1; id++) {
      if (Object.prototype.hasOwnProperty.call(auctionsIds, id)) {
        readPromises.push(await this._clipper.sales(auctionsIds[id].toNumber()).then(sale => {
          return ({ id: auctionsIds[id].toNumber(), sale });
        }));
      }
    }
    (await Promise.all(readPromises)).forEach(details => {
      this._activeAuctions[details.id] = details.sale;
    });

    //TODO: subscribe to file events to update dog, calc and other parameters
  }

  activeAuctions() {
    const currentTime = Math.floor(new Date() / 1000);
    const readPromises = [];

    for (const auctionId in this._activeAuctions) {
      if (Object.prototype.hasOwnProperty.call(this._activeAuctions, auctionId)) {
        const auction = this._activeAuctions[auctionId];
        readPromises.push(this._abacus.price(auction.top, currentTime - auction.tic)
          .then(price => { return ({ ...auction, price, id: auctionId }); }));
      }
    }
    return Promise.all(readPromises);
  }

  // execute an auction
  execute = async (auctionId, _amt, _maxPrice, _minProfit, _profitAddr, _gemJoinAdapter, _signer, exchangeCalleeAddress) => {

    //encoding calldata
    let typesArray = ['address', 'address', 'uint256', 'address[]'];
    let abiCoder = ethers.utils.defaultAbiCoder;
    let flashData = null;
    if (exchangeCalleeAddress === Config.vars.collateral[this._collateralName].uniswapCallee) {
      // uniswap v2 swap
      flashData = abiCoder.encode(typesArray, [
        _profitAddr,
        _gemJoinAdapter,
        _minProfit,
        Config.vars.collateral[this._collateralName].uniswapRoute
      ]);
    } else if (exchangeCalleeAddress === Config.vars.collateral[this._collateralName].uniswapLPCallee) {
      typesArray = ['address', 'address', 'uint256', 'address[]', 'address[]'];
      // uniswap v2 LP token swap
      flashData = abiCoder.encode(typesArray, [
        _profitAddr,
        _gemJoinAdapter,
        _minProfit,
        Config.vars.collateral[this._collateralName].token0.route,
        Config.vars.collateral[this._collateralName].token1.route
      ]);
    } else if (exchangeCalleeAddress === Config.vars.collateral[this._collateralName].oasisCallee) {
      // OasisDEX swap
      flashData = abiCoder.encode(typesArray, [
        _profitAddr,
        _gemJoinAdapter,
        _minProfit,
        [this._collateral, Config.vars.dai]
      ]);
    }

    let id = abiCoder.encode(['uint256'], [auctionId]);


    const initial_price = await _signer.getGasPrice();
    const gasStrategy = new GeometricGasPrice(initial_price.add(BigNumber.from(Config.vars.initialGasOffsetGwei ?? 0).mul(1e9)).toNumber(), Config.vars.txnReplaceTimeout, Config.vars.dynamicGasCoefficient);

    let take_transaction;
    try {
      take_transaction = await this._clipper.populateTransaction.take(id, _amt, _maxPrice, exchangeCalleeAddress, flashData);
    } catch (error) {
      console.log(error.message);
    }
    console.log(`\nAttempting to take ${ethers.utils.formatUnits(_amt)} ${this._collateralName} from auction ${auctionId} at max price ${ethers.utils.formatUnits(_maxPrice.div(1e9))} Dai`);
    try {
      const txn = new Transact(take_transaction, _signer, Config.vars.txnReplaceTimeout, gasStrategy);
      const response = await txn.transact_async();
      if (response != undefined) {
        console.log(`Auction ${auctionId} Take Tx Hash ${response.hash}`);
      }

    } catch (error) {
      console.error(error);
    }
  }

  // Check if auction needs redo and redo auction
  auctionStatus = async (auctionId, kprAddress, _signer) => {
    const initial_price = await _signer.getGasPrice();
    const gasStrategy = new GeometricGasPrice(initial_price.add(BigNumber.from(Config.vars.initialGasOffsetGwei ?? 0).mul(1e9)).toNumber(), Config.vars.txnReplaceTimeout, Config.vars.dynamicGasCoefficient);
    try {
      const auctionStatus = await this._clipper.getStatus(auctionId);
      if (auctionStatus.needsRedo === true) {
        console.log(`\nRedoing auction ${auctionId}`);
        const redo_transaction = await this._clipper.populateTransaction.redo(auctionId, kprAddress);
        const txn = new Transact(redo_transaction, _signer, Config.vars.txnReplaceTimeout, gasStrategy);
        const response = await txn.transact_async();
        console.log(`Redone auction ${auctionId} Tx hash: ${response.hash}`);
        return true;
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  };
}

