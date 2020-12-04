import network from './singleton/network';
import { ethers } from 'ethers';
import Config from './singleton/config';


export default class transact {
  _ethers;
  _abi;
  _address;
  _contract;
  _function_name;
  _parameters;

  constructor( ilkType ) {
    this._ethers = ethers;
    this._abi = abi;
    this._address = address;
    this._contract = contract;
    this._function_name = function_name;
    this._parameters = parameters;

  }

  async transact( ) {


  }

  // async init() {
  //
  //   this._clipper = new ethers.Contract(this._clipperAddr, clipperAbi, network.provider);
  //   this._abacusAddr = await this._clipper.calc();
  //   this._abacus = new ethers.Contract(this._abacusAddr, abacusAbi, network.provider);
  //
  //   this._kickListener = this._clipper.on('Kick', (id, top, tab, lot, usr, event) => {
  //     network.provider.getBlock(event.blockNumber).then(block => {
  //       const tic = block.timestamp;
  //       this._activeAuctions[id] = { top, tab, lot, id, usr, tic };
  //     });
  //   } );
  //
  //   // eslint-disable-next-line no-unused-vars
  //   this._takeListener = this._clipper.on('Take', (id, max, price, owe, tab, lot, usr, event) => {
  //     if ( lot === 0 || tab === 0 ) {
  //       // Auction is over
  //       delete(this._activeAuctions[id]);
  //     } else {
  //       // Collateral remaining in auction
  //       this._activeAuctions[id].lot = lot;
  //       this._activeAuctions[id].tab = tab;
  //     }
  //   } );
  //
  //   this._redoListener = this._clipper.on('Redo', (id, top, tab, lot, usr, event) => {
  //     network.provider.getBlock(event.blockNumber).then(block => {
  //       const tic = block.timestamp;
  //       this._activeAuctions[id].top = top;
  //       this._activeAuctions[id].tic = tic;
  //     });
  //   });
  //
  //   //Load the active auctions
  //   const auctionsIds = await this._clipper.list();
  //   const readPromises = [];
  //   for (const id in auctionsIds) {
  //     if(Object.prototype.hasOwnProperty.call(auctionsIds, id)) {
  //       readPromises.push(this._clipper.sales(id).then(sale => {
  //         return ({id, sale});
  //       }));
  //     }
  //   }
  //   (await Promise.all(readPromises)).forEach( details => {
  //     this._activeAuctions[details.id] = details.sale;
  //   });
  //
  //     //TODO: subscribe to file events to update dog, calc and other parameters
  // }
  //
  // activeAuctions() {
  //   const currentTime = Math.floor(new Date()/1000);
  //   const readPromises = [];
  //
  //   for (const auctionId in this._activeAuctions) {
  //     if(Object.prototype.hasOwnProperty.call(this._activeAuctions, auctionId)) {
  //       const auction = this._activeAuctions[auctionId];
  //       readPromises.push(this._abacus.price(auction.top, currentTime-auction.tic)
  //         .then(price => {return({...auction, price, id:auctionId});}));
  //     }
  //   }
  //   return Promise.all(readPromises);
  // }
}
