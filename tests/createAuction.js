import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { Transact } from "../src/transact";
import TestchainConfig from '../testchain/out/addresses-for-keeper.json';
import dogAbi from '../testchain/out/abi/keeper/Dog.json';
import Engine from '../testchain/lib/testrunner/src/engine';
import { ETH } from '../testchain/lib/testrunner/node_modules/@makerdao/dai-plugin-mcd';


// Deployer Account for Testchain, passphrase=''
const keydata = {
  "address": "16fb96a5fa0427af0c8f7cf1eb4870231c8154b6",
  "crypto": {
    "cipher": "aes-128-ctr",
    "ciphertext": "2e634fb145ec7a081dbc2c92b9d98212ba8eb1dcc297b8a8de6a935881035c83",
    "cipherparams": {
      "iv": "389ed2d689fe73ad2dce53c23260afc3"
    },
    "kdf": "scrypt",
    "kdfparams": {
      "dklen": 32,
      "n": 262144,
      "p": 1,
      "r": 8,
      "salt": "9a42ea3966ca7ee9e84bb5e201978e69740272940daf1e232e0fc474cb6cc8d9"
    },
    "mac": "cb3f6da2d001618abbefbe918fb88a5945045f15bbe90cd380570f1a9359bdea"
  },
  "id": "53b50ebf-a9b0-44f8-86de-5d6ed919e6ad",
  "version": 3
};


export default class CreateAuction {
  _collateralName;
  _vaultCollateralSize;
  _signer;

  constructor(collateralName, collateralSize, signer) {
    this._collateralName = collateralName;
    this._vaultCollateralSize = collateralSize;
    this._signer = signer;
  }

  async startAuction() {
    fs.mkdirSync('/tmp/testrunner', { recursive: true });
    fs.writeFileSync('/tmp/testrunner/key', JSON.stringify(keydata));
    const workingDirPath = path.resolve();
    const fullpath = path.join(workingDirPath, './node_modules/@makerdao/testchain/out/addresses-mcd.json');
    console.log(fullpath);

    const engine = new Engine({
      actors: { user1: 'selfTestUser' },
      actions: [
        [
          ['user1'],
          [
            ['cdpOpenUnsafe', {
                collateral: ETH(this._vaultCollateralSize),
                ilk: this._collateralName
              }
            ]
          ]
        ]
      ],
      addressesConfig: fullpath,
      url: 'http://localhost:2000'
    });
    const report = await engine.run();
    console.log(report)

    // Liquidate the unsafe vault and start an auction
    const dog = new ethers.Contract(TestchainConfig.MCD_DOG, dogAbi, this._signer.provider);
    // const bark_transaction = await dog.populateTransaction.bark(/*TODO: convert to bytes32*/ this._collateralName, /*TODO: Find out the urnAddress*/);
    // const txn = new Transact(bark_transaction, this._signer);
    // await txn.transact_async();
  }

}
