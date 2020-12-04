import network from './singleton/network';
import { ethers } from 'ethers';
import Config from './singleton/config';


export default class Transact {
  _provider;
  _abi;
  _address;
  _contract;
  _function_name;
  _parameters;
  _unsigned_tx;
  _singer;

  constructor(unsigned_tx, signer) {
    this._unsigned_tx = unsigned_tx;
    this._signer = signer;
    // this._abi = abi;
    // this._address = address;
    // this._function_name = function_name;
    // this._parameters = parameters;
    //
    // this._contract = ethers.Contract(this._address, this._abi, this._provider)
  }

  async transact_async() {

    const signed_tx = await this._signer.signTransaction(this._unsigned_tx);
    await this._signer.sendTransaction(signed_tx).then(console.log);







    // var url = 'ADD_YOUR_ETHEREUM_NODE_URL';
    // var customHttpProvider = new ethers.providers.JsonRpcProvider(url);
    // var privateKey = "0x0111111111111111111122222222222222222223333333333333333333344445";
    // var wallet = new ethers.Wallet(privateKey);
    // console.log("Address: " + wallet.address);
    // tx = {
    //   to: "0x6E0d01A76C3Cf4288372a29124A26D4353EE51BE",
    //   value: ethers.utils.parseEther("0.05"),
    //   chainId: 42,
    //   nonce: 3
    // }
    // customHttpProvider.estimateGas(tx).then(function(estimate) {
    //     tx.gasLimit = estimate;
    //     tx.gasPrice = ethers.utils.parseUnits("0.14085197", "gwei");
    //     wallet.signTransaction(tx).then((signedTX)=>{
    // 	customHttpProvider.sendTransaction(signedTX).then(console.log);
    //   });
    // });




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
