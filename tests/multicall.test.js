/**
 * @jest-environment node
 */
import Config from '../src/singleton/config';
import network from '../src/singleton/network';
import { ethers, BigNumber } from 'ethers';

import config from '../config/kovan.json';
import Multicall from '../src/multicall.js';

network.rpcURL = 'https://kovan.infura.io/v3/11465e3f27b247eb8b785c23047b29fd';
Config.vars = config;

test('Multicall output:', async () => {
    const multicall = new Multicall();
    await multicall.updateClipperAddresses();
    multicall.setupClipperContracts();
    console.log(multicall._clippers);
    await multicall.getActiveAuctions();
}, 90000);
