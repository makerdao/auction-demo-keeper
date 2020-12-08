import network from './singleton/network';
import { ethers } from 'ethers';
import Config from './singleton/config';

// if NonceManager.sendTransaction begins to work, consider refactoring
// https://github.com/ethers-io/ethers.js/blob/master/packages/experimental/src.ts/nonce-manager.ts#L68
// Answer may be in here: https://github.com/ethers-io/ethers.js/issues/972
import { NonceManager } from '@ethersproject/experimental';

const sleep = async function(delay) {await new Promise((r) => setTimeout(r, delay));};

export default class Transact {
  _unsigned_tx;
  _singer;

  constructor(unsigned_tx, signer) {
    this._unsigned_tx = unsigned_tx;
    this._signer = signer;

  }

  gasPrice() {
    return ethers.utils.parseUnits("0.14085197", "gwei");
  }

  async sign_and_send(_nonce = null) {
    const nonce = (_nonce == null) ? this._signer.getTransactionCount() : _nonce
    const gasLimit = this._signer.estimateGas(this._unsiged_tx)
    const network = this._signer.provider.getNetwork()

    await Promise.all([nonce, gasLimit, network]).then(values => {
      this._unsigned_tx.nonce = values[0];
      this._unsigned_tx.gasLimit = values[1];
      this._unsigned_tx.chainId = values[2].chainId;
    })

    this._unsigned_tx.gasPrice = this.gasPrice()

    console.log(JSON.stringify(this._unsigned_tx, null, 4));

    const signed_tx = await this._signer.signTransaction(this._unsigned_tx);
    return await this._signer.provider.sendTransaction(signed_tx);

  }

  async transact_async() {
    let response = await this.sign_and_send();

    while(true) {

      let receipt = null;
      this._signer.provider.waitForTransaction(response.hash, undefined, Config.txnReplaceTimeout)
        .then(result => {
          receipt = result;
          console.log("mined!");
        });

      console.log("sleeping")
      // await sleep(Config.txnReplaceTimeout); Figure out why this is not working
      await sleep(4000);
      console.log("waking up")

      if (receipt != null) {
        console.log("exiting")
        console.log(receipt)
        break;

      } else {
        // This is where you'd put in a higher gas price
        // Sign and send the same transaction, but with a higher gas price
        console.log("transaction replaced")
        response = await this.sign_and_send();

      }
    }

    // return receipt;
  }


}
