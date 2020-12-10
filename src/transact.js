import { ethers } from 'ethers';

// if NonceManager.sendTransaction begins to work, consider refactoring
// https://github.com/ethers-io/ethers.js/blob/master/packages/experimental/src.ts/nonce-manager.ts#L68
// Answer may be in here: https://github.com/ethers-io/ethers.js/issues/972
import { NonceManager } from '@ethersproject/experimental';


const sleep = async function(delay) {await new Promise((r) => setTimeout(r, delay));};

export default class Transact {
  _unsigned_tx;
  _singer;
  _timeout;

  constructor(unsigned_tx, signer, timeout) {
    this._unsigned_tx = unsigned_tx;
    this._signer = signer;
    this._timeout = timeout;

  }

  gasPrice() {
    return ethers.utils.parseUnits("10.14085197", "gwei");
  }

  // Does not handle transaction locking: https://github.com/makerdao/pymaker/blob/master/pymaker/__init__.py#L715
  async sign_and_send(_previousNonce = null) {

    // Take into account transactions done with other wallets (i.e. MetaMask): https://github.com/makerdao/pymaker/pull/201#issuecomment-731382038
    const pendingNonce = this._signer.getTransactionCount("pending")
    const gasLimit = this._signer.estimateGas(this._unsiged_tx)
    const network = this._signer.provider.getNetwork()

    await Promise.all([pendingNonce, gasLimit, network]).then(values => {
      this._unsigned_tx.nonce = Math.max(values[0], _previousNonce);
      this._unsigned_tx.gasLimit = values[1];
      this._unsigned_tx.chainId = values[2].chainId;
    })

    this._unsigned_tx.gasPrice = this.gasPrice()

    console.log(`Sending a transaction \n
      from ${this._signer.address} \n
      to ${this._unsigned_tx.to} \n
      nonce ${this._unsigned_tx.nonce} \n
      gasLimit ${this._unsigned_tx.gasLimit.toNumber()} \n
      gasPrice ${ethers.utils.formatUnits(this._unsigned_tx.gasPrice.toNumber(),"gwei")} Gwei`)

    const signed_tx = await this._signer.signTransaction(this._unsigned_tx);
    return await this._signer.provider.sendTransaction(signed_tx);

  }

  async transact_async() {
    let minConfirmations = 1;
    let response = await this.sign_and_send();

    while(true) {

      let receipt = undefined;
      // This promise resolves once the transaction has been mined (confirmed by a minConfirmation size)
      // Set a timer on the promise, equivalent to the transaction replacement timeout
      this._signer.provider.waitForTransaction(response.hash, minConfirmations, this._timeout)
        .then(result => {
          receipt = result;
        });

      // Wait until the timeout is reached to either confirm publishing or replace transaction
      await sleep(this._timeout);

      // Check if transaction was published
      if (receipt != undefined) {
        break;

      // Replace Transaction if it wasn't mined within the allotted timeout
      } else {
        // Sign and send the same transaction, but with a higher gas price
        console.log("Transaction still pending. Will send a replacement transaction")
        response = await this.sign_and_send(response.nonce);
      }
      
    }

    //return receipt; // TODO figure out how to return the receipt once it's resolved
    return response;
  }


}
