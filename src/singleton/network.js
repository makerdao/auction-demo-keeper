import {ethers} from 'ethers';

class network {
  _provider;
  constructor() {
  }

  set rpcURL (url) {this._provider = new ethers.providers.JsonRpcProvider(url);}
  get provider () {return this._provider;}
}

export default (new network());
