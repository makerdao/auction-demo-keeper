/**
 * @jest-environment node
 */
import Config from '../src/singleton/config';
import network from '../src/singleton/network';
import {ethers, BigNumber } from 'ethers';
import { expect } from '@jest/globals';
import config from '../config/kovan.json';
import UniswapAdaptor from '../src/dex/uniswap';
import oasisDexAdaptor from '../src/dex/oasisdex';

network.rpcURL = 'https://kovan.infura.io/v3/11465e3f27b247eb8b785c23047b29fd';
Config.vars = config;

test('Uniswap Adaptor Opportunity', async () => {
    const uniswap = new UniswapAdaptor(Config.vars.collateral['WBTC-A'].erc20addr, Config.vars.collateral['WBTC-A'].uniswapCallee, 'WBTC-A');
    const book = await uniswap.fetch('5000000000000000');
    console.log('BOOK: ', book);
    expect(book.receiveAmount > 0);
}, 20000);

// test('OasisDEX Adaptor Opportunity', async () => {
//     const oasis = new oasisDexAdaptor(Config.vars.collateral['WBTC-A'].erc20addr, Config.vars.collateral['WBTC-A'].oasisCallee);
//     await oasis.fetch();
//     let auctionPrice = BigNumber.from('50000023461595432977698');
//     let oasisDexAvailability = oasis.opportunity(auctionPrice);
//     console.log('Oasis Opportunity: ', ethers.utils.formatEther(oasisDexAvailability));
//     expect(oasisDexAvailability > 0);
// }, 20000);
