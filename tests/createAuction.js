import { ethers } from 'ethers';
import fs from 'fs';
import Engine from './lib/testrunner/src/engine';
import { ETH } from './lib/testrunner/node_modules/makerdao/dai-plugin-mcd';


// Deployer Account for Testchain
const keydata = {
  "address": "16fb96a5fa0427af0c8f7cf1eb4870231c8154b6",
  "crypto": {
    "cipher": "aes-128-ctr",
    "ciphertext": "d2b787746c29148b01ae7079ab729541554951ce5a9fa661b399a13e08b0f1a6",
    "cipherparams": {
      "iv": "cd5dd273ecc23dac0956e1cfe36d526a"
    },
    "kdf": "scrypt",
    "kdfparams": {
      "dklen": 32,
      "n": 262144,
      "p": 1,
      "r": 8,
      "salt": "c200dd2837dec57adaf6ccaabaec84d40cebe2bf244f2e9baa2a19b8081a1140"
    },
    "mac": "e529e74ad3155e141aebf0fc1b6629d1a67b620b1f21f68d10549806a26957e7"
  },
  "id": "53b50ebf-a9b0-44f8-86de-5d6ed919e6ad",
  "version": 3
};


export class CreateAuction {
  _collateralName;
  _vaultCollateralSize;


  constructor(collateralName, collateralSize) {
    this._collateralName = collateralName;
    this._vaultCollateralSize = collateralSize;
  }

  async startAuction() {
    fs.mkdirSync('/tmp/testrunner', { recursive: true });
    fs.writeFileSync('/tmp/testrunner/key', JSON.stringify(keydata));

    const engine = new Engine({
      actors: { user1: 'selfTestUser' },
      actions: [
        [
          ['user1'],
          [
            ['cdpOpenUnsafe', {
                collateral: ETH(1),
                ilk: this._collateralName;
              }
            ]
          ]
        ]
      ],
      address: keydata.address,
      keystore: '/tmp/testrunner',
      url: 'http://localhost:2000',
      password: 'test123'
    });
    const report = await engine.run();
    console.log(report)
  }
}
