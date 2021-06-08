/* eslint-disable no-unused-vars */
/* eslint-disable no-constant-condition */

/* The Transact module is responsible for
* handling estimated gas cost and sending signed and unsignedd
* transactions
*/

import { ethers, BigNumber } from 'ethers';

// if NonceManager.sendTransaction begins to work, consider refactoring
// https://github.com/ethers-io/ethers.js/blob/master/packages/experimental/src.ts/nonce-manager.ts#L68
// Answer may be in here: https://github.com/ethers-io/ethers.js/issues/972
import { NonceManager } from '@ethersproject/experimental';
import Config from './singleton/config.js';

const sleep = async function (delay) { await new Promise((r) => setTimeout(r, delay * 1000)); };
const sendBadTxesToChain = false;  // set true to spend gas sending send bad transactions to chain for debugging

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

  constructor(initial_price, every_secs, coefficient = 1.125, max_price = null) {
    this._initial_price = initial_price;
    this._every_secs = every_secs;
    this._coefficient = coefficient;
    this._max_price = max_price;
  }

  //Get the Gas price in wei [integer]
  get_gas_price(time_elapsed) {
    let result = this._initial_price;

    if (time_elapsed >= this._every_secs) {
      const cycles = [...Array(Math.floor(time_elapsed / this._every_secs))];

      cycles.forEach(() => {
        result *= this._coefficient;
      });

    }

    if (this._max_price !== null) {
      result = Math.min(result, this._max_price);
    }

    return Math.ceil(result);
  }


}

export class Transact {
  _unsigned_tx;
  _signer;
  _timeout;     // seconds
  _initial_time;
  _gasStrategy;
  _estimatedGas;

  constructor(unsigned_tx, signer, timeout = 15000, gasStrategy = null) {
    this._unsigned_tx = unsigned_tx;
    this._signer = signer;
    this._timeout = timeout * 1000; // convert to miliseconds
    this._gasStrategy = gasStrategy;
  }

  // Does not handle transaction locking: https://github.com/makerdao/pymaker/blob/master/pymaker/__init__.py#L715
  async sign_and_send(_previousNonce = null) {
    console.log('previousNonce: ', _previousNonce);
    // Take into account transactions done with other wallets (i.e. MetaMask): https://github.com/makerdao/pymaker/pull/201#issuecomment-731382038
    const pendingNonce = this._signer.getTransactionCount('pending');
    // const gasLimit = 5000000;
    const network = this._signer.provider.getNetwork();

    await Promise.all([pendingNonce, network]).then(values => {
      if (_previousNonce !== null) {
        this._unsigned_tx.nonce = _previousNonce;
      } else {
        this._unsigned_tx.nonce = values[0];
      }
      // this._unsigned_tx.gasLimit = values[1];
      this._unsigned_tx.gasLimit = this._estimatedGas.mul(15).div(10);
      // setting a max gas limit.
      if (this._unsigned_tx.gasLimit.gt(Config.vars.maxGasLimit)) {
        this._unsigned_tx.gasLimit = BigNumber.from(Config.vars.maxGasLimit);
      }
      this._unsigned_tx.chainId = values[1].chainId;
    });

    const seconds_elapsed = Math.round((new Date() - this._initial_time) / 1000);
    // console.log(seconds_elapsed)
    // Defaults to the node's suggested gas price if gasStrategy is not supplied

    if (this._gasStrategy === null) {
      this._unsigned_tx.gasPrice = await this._signer.getGasPrice();
    } else {
      let gasPrice = await this._gasStrategy.get_gas_price(seconds_elapsed);
      this._unsigned_tx.gasPrice = ethers.BigNumber.from(gasPrice);
    }

    // this._unsigned_tx.gasPrice = await ((this._gasStrategy === null) ? (
    //   await this._signer.getGasPrice()
    // ) : (
    //   ethers.BigNumber.from(this._gasStrategy.get_gas_price(seconds_elapsed))
    // ));

    console.log(`
    Sending a transaction
    from ${this._signer.address}
    to ${this._unsigned_tx.to}
    nonce ${this._unsigned_tx.nonce}
    gasLimit ${this._unsigned_tx.gasLimit.toNumber()}
    gasPrice ${ethers.utils.formatUnits(this._unsigned_tx.gasPrice.toNumber(), 'gwei')} Gwei\n`);

    const signed_tx = await this._signer.signTransaction(this._unsigned_tx);
    return await this._signer.provider.sendTransaction(signed_tx);

  }

  async transact_async() {
    this._initial_time = new Date();
    let minConfirmations = 1;

    let response;

    while (true) {
      try {
        this._estimatedGas = await this._signer.estimateGas(this._unsigned_tx);
      } catch {
        console.error('\nTX WILL REVERT\n', '\n');
        this._estimatedGas = BigNumber.from(500000);
        if (!sendBadTxesToChain) {
          const value = await this._signer.call(this._unsigned_tx);
          return ethers.utils.hexDataLength(value) % 32 === 4 && ethers.utils.hexDataSlice(value, 0, 4) === '0x08c379a0'
              ? ethers.utils.defaultAbiCoder.decode(['string'], ethers.utils.hexDataSlice(value, 4))
              : undefined;
        }
      }

      if (response === undefined) {
        response = await this.sign_and_send();
      } else {
        response = await this.sign_and_send(response.nonce);
      }

      // This promise resolves once the transaction has been mined (confirmed by a minConfirmation size)
      // Set a timer on the promise, equivalent to the transaction replacement timeout
      // this._signer.provider.waitForTransaction(response.hash, minConfirmations, this._timeout)
      //   .then(result => {
      //     receipt = result;
      //   });

      let receipt = undefined;
      try {
        receipt = await this._signer.provider.waitForTransaction(response.hash, minConfirmations, this._timeout);
      } catch (error) {
        if (error.code === 'TIMEOUT') {
          console.log('There was a timeout waiting for receipt');
        } else {
          throw error;
        }
      }
      // Wait until the timeout is reached to either confirm publishing or replace transsaction
      // await sleep(this._timeout / 1000);

      // Check if transaction was published
      if (receipt != undefined) {
        break;

        // Replace Transaction if it wasn't mined within the allotted timeout
      } else {
        // Sign and send the same transaction, but with a higher gas price
        console.log('Transaction still pending. Will send a replacement transaction');
      }
    }

    //return receipt; // TODO figure out how to return the receipt once it's resolved
    return response;
  }
}
