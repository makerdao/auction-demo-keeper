/**
 * @jest-environment node
 */
import { ethers, BigNumber } from 'ethers';
import Config from '../src/singleton/config';
import network from '../src/singleton/network';
import { expect } from '@jest/globals';
import oasisDexAdaptor from '../src/dex/oasisdex';
import config from '../config/kovan.json';
import Clipper from '../src/clipper';
import Keeper from '../src/keeper';
import Wallet from '../src/wallet';
import { Transact } from '../src/transact';
import daiAbi from '../abi/Dai.json';

network.rpcURL = 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a';
Config.vars = config;
// console.log('network.rpcURL', network.provider);
// console.log('CONFIG ',Config.vars);


const sleep = async function (delay) { await new Promise((r) => setTimeout(r, delay * 1000)); };

// Testchain Deployer Address
const privateKey = '0x474BEB999FED1B3AF2EA048F963833C686A0FBA05F5724CB6417CF3B8EE9697E';
// console.log('Network Provider: ', network.provider);
const signer = new ethers.Wallet(privateKey, network.provider);
// console.log('Address: ' + signer.address);

test('Test BigNumber calculations', async () => {
  const T18 = ethers.utils.parseEther('1');
  const T9 = BigNumber.from('1000000000');
  const minProfitPercentage = ethers.utils.parseEther(Config.vars.minProfitPercentage);
  const rawTab = BigNumber.from('269809382023146153277328701369117752381660321410');
  const auctionPrice = BigNumber.from('29997000000000000000000000000');
  const lotAmount = rawTab.div(auctionPrice);
  console.log('minProfit ', lotAmount.toString());
  console.log('T27', T9.toString());
  const maxPrice = BigNumber.from('50126355766269257008019621850');
  const format = maxPrice.div(T9);
  console.log('format', ethers.utils.formatUnits(format.toString()));
},10000);

//test('keeper initialization, and one opportunity check loop', async () => {
//  const keepr = new Keeper('../config/kovan.json', network.rpcURL, 'kovan');
//  keepr.run();
//  await sleep(120);
//  keepr.stop();
//}, 120000);
//
//test('basic connectivity', async () => {
//  let id = await network.provider.getNetwork();
//  expect(typeof id.chainId).toBe('number');
//});
//
//test('read active auctions', async () => {
//  const clip = new Clipper('LINK-A');
//  await clip.init();
//  const auctions = await clip.activeAuctions();
//  console.log('All Auctions : ', auctions);
//  expect(auctions.length).toBeGreaterThan(0);
//},30000);
//
//test('last active auction has a price', async () => {
//  const clip = new Clipper('LINK-A');
//  await clip.init();
//  const auctions = await clip.activeAuctions();
//  expect(auctions[auctions.length-1].price.toNumber()).toBeGreaterThanOrEqual(0);
//},10000);
//
//// test('kick an auction and check that it is listed', async () => {
//// }, 50000);
//
//// test('kick an auction and check that it is listed', () => {
////   //generate an auction, check that clipper saw it, take it, check that clipper removed it from
////   // its active auction list
//// });
//
//// test('kick an auction and check its starting price', () => {
//
//// });
//
//
//// test('kick an auction check that its price decreases', () => {
////   //make sure that clipper is able to calculate the price correctly using abacus
//// });
//
//
//// test('check order book', async () => {
////   const oasis = new oasisDexAdaptor( Config.vars.collateral['LINK-A'].erc20addr, Config.vars.collateral['LINK-A'].oasisCallee );
////   await oasis.fetch();
////   expect(ethers.utils.formatUnits(await oasis.opportunity(ethers.utils.parseUnits('0.9')))).toBe('0.5');
//// },10000);
//
//
//test('kay facility: test wallet', async () => {
//  const wallet = new Wallet('/tests/jsonpassword.txt', '/tests/testwallet.json');
//  const jsonWallet = await wallet.getWallet();
//  console.log('Test Wallet Address: ', jsonWallet.address);
//  expect(jsonWallet.address).toBeDefined();
//}, 10000);
//
//test('key facility: try transaction', async () => {
//
//  const wallet = new Wallet('/tests/jsonpassword.txt', '/tests/testwallet.json');
//  const jsonWallet = await wallet.getWallet();
//  const signer = new ethers.Wallet(jsonWallet, network.provider);
//  const dai = new ethers.Contract(Config.vars.dai, daiAbi, signer.provider);
//  const approval_transaction = await dai.populateTransaction.approve(Config.vars.OasisDex, ethers.utils.parseEther('1.0'));
//  const txn = new Transact(approval_transaction, signer, Config.vars.txnReplaceTimeout);
//  await txn.transact_async();
//}, 25000);
