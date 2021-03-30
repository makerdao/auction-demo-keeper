/* eslint-disable no-unused-vars */
import network from './singleton/network';
import { ethers } from 'ethers';
import Config from './singleton/config';
import abacusAbi from '../abi/abacus';
import clipperAbi from '../abi/clipper';
import { Transact } from './transact';


export default class Clipper {
  _collateral;
  _collateralName;
  _clipper;
  _abacus;
  _abacusAddr;
  _activeAuctions = [];

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

    // initialize the abacus contract obbject
    this._abacus = new ethers.Contract(this._abacusAddr, abacusAbi, network.provider);

    // Listen for active auctions
    this._kickListener = this._clipper.on('Kick', (id, top, tab, lot, usr, kpr, coin, event) => {
      network.provider.getBlock(event.blockNumber).then(block => {
        const tic = block.timestamp;
        this._activeAuctions[id] = { top, tab, lot, id, usr, tic, kpr, coin };
      });
    });

    // eslint-disable-next-line no-unused-vars

    // Based on the auction state, get the collateral remaining in auction or delete auction
    this._takeListener = this._clipper.on('Take', (id, max, price, owe, tab, lot, usr, event) => {
      if (lot === 0 || tab === 0) {
        // Auction is over
        delete (this._activeAuctions[id]);
      } else {
        // Collateral remaining in auction
        this._activeAuctions[id].lot = lot;
        this._activeAuctions[id].tab = tab;
      }
    });
    // recall the listener to check for active auctions
    this._redoListener = this._clipper.on('Redo', (id, top, tab, lot, usr, event) => {
      network.provider.getBlock(event.blockNumber).then(block => {
        const tic = block.timestamp;
        this._activeAuctions[id].top = top;
        this._activeAuctions[id].tic = tic;
      });
    });

    //Load the active auctions
    const auctionsIds = await this._clipper.list();
    const readPromises = [];
    for (let id = 0; id <= auctionsIds.length - 1; id++) {
      if (Object.prototype.hasOwnProperty.call(auctionsIds, id)) {
        readPromises.push(await this._clipper.sales(auctionsIds[id].toNumber()).then(sale => {
          return ({ id:auctionsIds[id].toNumber(), sale });
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

  // eslint-disable-next-line no-unused-vars
  // execute () {
  //TODO use this._exchange.callee.address to get exchange callee address

  // const transaction = new Transact( network.provider, clipperAbi, this._clipper.address, );
  // await transacttion.transac_async();


  // execute an auction
  execute = async (auctionId, _amt, _maxPrice, _minProfit, _profitAddr, _gemJoinAdapter, _signer, exchangeCalleeAddress) => {

    let minProfit = ethers.utils.parseEther(`${_minProfit}`);

    //encoding calldata
    let typesArray = ['address', 'address', 'uint256'];
    let abiCoder = ethers.utils.defaultAbiCoder;
    let flashData = abiCoder.encode(typesArray, [_profitAddr, _gemJoinAdapter, minProfit]);

    let id = abiCoder.encode(['uint256'], [auctionId]);
    let amt = ethers.utils.parseEther(`${_amt}`);
    let maxPrice = ethers.utils.parseUnits(`${_maxPrice}`, 27);

    const clipper = new ethers.Contract(Config.vars.clipper, clipperAbi, _signer.provider);
    const take_transaction = await clipper.populateTransaction.take(id, amt, maxPrice, exchangeCalleeAddress, flashData);
    console.log('Take_Transaction ', take_transaction);
    const txn = new Transact(take_transaction, _signer, Config.vars.txnReplaceTimeout);
    await txn.transact_async();
  }

}