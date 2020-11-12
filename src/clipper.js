import network from './singleton/network';
import { ethers } from 'ethers';
import config from '../config/mainnet';
import abacusAbi from '../abi/abacus';
import clipperAbi from '../abi/abacus';


export default class clipper {
  _collateral;
  _collateralName;
  _clipper;
  _abacus;
  _abacusAddr;
  _activeAuctions;

  _kickListener;
  _takeListener;
  _redoListener;

  constructor( ilkType ) {
    const collInfo = config.vars.collateral[ilkType];

    this._collateralName = ilkType;
    this._clipperAddr = collInfo.clipper;
    this._collateral = collInfo.erc20addr;

    //TODO: start timer every minute
  }

  async init() {
    this._abacusAddr = await clipper.calc();
    this._abacus = new ethers.Contract(this._abacusAddr, abacusAbi, network.provider);
    this._clipper = new ethers.Contract(this._clipperAddr, clipperAbi, network.provider);

    this._kickListener = this._clipper.on('Kick jksdsomething', (id, top, tab, lot, usr, event) => {
      network.provider.getBlock(event.blockNumber).then(block => {
        const tic = block.timestamp;
        this._activeAuctions[id] = { top, tab, lot, id, usr, tic };
      });
    } );

    // eslint-disable-next-line no-unused-vars
    this._takeListener = this._clipper.on('Take jksdsomething', (id, max, price, owe, tab, lot, usr, event) => {
      if ( lot === 0 || tab === 0 ) {
        // Auction is over
        delete(this._activeAuctions[id]);
      } else {
        // Collateral remaining in auction
        this._activeAuctions[id].lot = lot;
        this._activeAuctions[id].tab = tab;
      }
    } );

    this._redoListener = this._clipper.on('Redo jksdsomething', (id, top, tab, lot, usr, event) => {
      network.provider.getBlock(event.blockNumber).then(block => {
        const tic = block.timestamp;
        this._activeAuctions[id].top = top;
        this._activeAuctions[id].tic = tic;
      });
    });

    //Load the active auctions
    const auctionsIds = await clipper.active();
    const readPromises = [];
    for (const id in auctionsIds) {
      readPromises.push(this._clipper.sales(id).then(sale => {return({id,sale});}));
    }
    (await Promise.all(readPromises)).forEach( details => {
      this._activeAuctions[details.id] = details.sale;
    });

      //TODO: subscribe to file events to update dog, calc and other parameters
  }

  activeAuctions() {
    const currentTime = new Date()/1000;
    const readPromises = [];

    for (const auction in this._activeAuctions) {
      if(Object.prototype.hasOwnProperty.call(this._activeAuctions, auction)) {
        readPromises.push(this._abacus.price(auction.top, currentTime-auction.tic)
          .then(price => {return({...auction, price});}));
      }
    }
    return Promise.all(readPromises);
  }
}
