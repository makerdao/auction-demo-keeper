/**
 * @jest-environment node
 */
import { ethers } from 'ethers';
import Config from '../src/singleton/config';
import network from '../src/singleton/network';
import {expect} from '@jest/globals';
import config from '../config/kovan.json';
import { Transact } from '../src/transact';
import daiAbi from '../abi/Dai.json';
import Wallet from '../src/wallet';
import UniswapAdaptor from '../src/dex/uniswap';

network.rpcURL = 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a';
Config.vars = config;


test('basic connectivity', async () => {
  let id = await network.provider.getNetwork();
  expect(typeof id.chainId).toBe('number');
});

test('kay facility: test wallet', async () => {
  const wallet = new Wallet('/tests/jsonpassword.txt', '/tests/testwallet.json');
  const jsonWallet = await wallet.getWallet();
  expect(jsonWallet.address).toBeDefined();
}, 10000);

test('key facility: try transaction', async () => {

  const wallet = new Wallet('/tests/jsonpassword.txt', '/tests/testwallet.json');
  const jsonWallet = await wallet.getWallet();
  console.log('Network provider in try transaction ', await network.provider);
  const signer = new ethers.Wallet(jsonWallet, network.provider);
  console.log('Address: ' + signer.address);

  const dai = new ethers.Contract(Config.vars.dai, daiAbi, signer.provider);
  const approval_transaction = await dai.populateTransaction.approve(Config.vars.OasisDex, ethers.utils.parseEther("1.0"));
  const txn = new Transact(approval_transaction, signer, Config.vars.txnReplaceTimeout);
  await txn.transact_async();

}, 20000);

test('Uniswap Adaptor Opportunity', async () => {
    const uniswap = new UniswapAdaptor();
    console.log('Uniswap fetch: ', await uniswap.fetch('1000000000000000000'));
    await uniswap.fetch('1000000000000000000');
    const book = uniswap.opportunity();
    console.log('BOOK: ', book);
    expect(book.length > 0);
}, 20000);