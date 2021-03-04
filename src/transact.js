import { ethers } from 'ethers';

// if NonceManager.sendTransaction begins to work, consider refactoring
// https://github.com/ethers-io/ethers.js/blob/master/packages/experimental/src.ts/nonce-manager.ts#L68
// Answer may be in here: https://github.com/ethers-io/ethers.js/issues/972
import { NonceManager } from '@ethersproject/experimental';


const sleep = async function(delay) {await new Promise((r) => setTimeout(r, delay*1000));};


// Geometrically increasing gas price.
//
// Start with `initial_price`, then increase it every 'every_secs' seconds by a fixed coefficient.
// Coefficient defaults to 1.125 (12.5%), the minimum increase for Parity to replace a transaction.
// Coefficient can be adjusted, and there is an optional upper limit.
// https://github.com/makerdao/pymaker/blob/master/pymaker/gas.py#L168
//
// NOTE: This class is limited by JS's MAX_SAFE_INTEGER, which is 9 MM Gwei
export class GeometricGasPrice {
  _initial_price; // wei
  _every_secs;    // seconds
  _coefficient;   // unitless
  _max_price;     // wei

  constructor(initial_price, every_secs, coefficient=1.125, max_price = null) {
    this._initial_price = initial_price;
    this._every_secs = every_secs;
    this._coefficient = coefficient;
    this._max_price = max_price;
  }

  // Gas price in wei [integer]
  get_gas_price(time_elapsed) {
    let result = this._initial_price;

    if (time_elapsed >= this._every_secs) {
      const cycles = [...Array(Math.floor(time_elapsed/this._every_secs))]

      cycles.forEach(() => {
        result *= this._coefficient;
      })

    }

    if (this._max_price !== null) {
      result = Math.min(result, this._max_price)
    }

    return Math.ceil(result)
  }


}

export class Transact {
  _unsigned_tx;
  _singer;
  _timeout;     // seconds
  _initial_time;
  _gasStrategy;

  constructor(unsigned_tx, signer, timeout = 15000, gasStrategy = null) {
    this._unsigned_tx = unsigned_tx;
    this._signer = signer;
    this._timeout = timeout * 1000; // convert to miliseconds
    this._gasStrategy = gasStrategy;

  }

  // Does not handle transaction locking: https://github.com/makerdao/pymaker/blob/master/pymaker/__init__.py#L715
  async sign_and_send(_previousNonce = null) {

    // Take into account transactions done with other wallets (i.e. MetaMask): https://github.com/makerdao/pymaker/pull/201#issuecomment-731382038
    const pendingNonce = this._signer.getTransactionCount("pending")
    const gasLimit = this._signer.estimateGas(this._unsiged_tx)
    const network = this._signer.provider.getNetwork()

    await Promise.all([pendingNonce, gasLimit, network]).then(values => {
      this._unsigned_tx.nonce = Math.max(values[0], _previousNonce)
      this._unsigned_tx.gasLimit = values[1];
      this._unsigned_tx.chainId = values[2].chainId;
    })

    const seconds_elapsed = Math.round((new Date() - this._initial_time)/1000);
    // console.log(seconds_elapsed)
    // Defaults to the node's suggested gas price if gasStrategy is not supplied
    this._unsigned_tx.gasPrice = await ( (this._gasStrategy === null) ? (
        this._signer.getGasPrice()
      ) : (
        ethers.BigNumber.from(this._gasStrategy.get_gas_price(seconds_elapsed))
      ));

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
    this._initial_time = new Date();
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
      await sleep(this._timeout / 1000);

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
