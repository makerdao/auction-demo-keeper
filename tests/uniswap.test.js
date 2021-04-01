// /**
//  * @jest-environment node
//  */
// import Config from '../src/singleton/config';
// import network from '../src/singleton/network';
// import {expect} from '@jest/globals';
// import config from '../config/kovan.json';
// import UniswapAdaptor from '../src/dex/uniswap';

// network.rpcURL = 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a';
// Config.vars = config;

// test('Uniswap Adaptor Opportunity', async () => {
//     const uniswap = new UniswapAdaptor(Config.vars.collateral['LINK-A'].erc20addr, Config.vars.collateral['LINK-A'].uniswapCallee);
//     await uniswap.fetch('16490000000000000000');
//     const book = uniswap.opportunity();
//     console.log('BOOK: ', book);
//     expect(book.receiveAmount > 0);
// }, 20000);