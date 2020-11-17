/**
 * @jest-environment node
 */
import { ethers } from 'ethers';
import Config from '../src/singleton/config';
import network from '../src/singleton/network';
import {expect} from "@jest/globals";
import oasisDexAdaptor from '../src/dex/oasisdex';
import config from '../config/testchain.json';
import clipper from "../src/clipper";
import keeper from "../src/keeper";

network.rpcURL = 'http://localhost:2000';
Config.vars = config;


const sleep = async function(delay) {await new Promise((r) => setTimeout(r, delay));};


test('keeper initialization, and one opportunity check loop', async () => {
  const keepr = new keeper('http://localhost:2000', 'testchain');
  keepr.run();
  await sleep(8000);
  keepr.stop();
}, 10000);

test('basic connectivity', async () => {
  expect(typeof (await network.provider.getNetwork()).chainId).toBe('number');
});

test('read active auctions', async () => {
  const clip = new clipper( 'ETH-A' );
  await clip.init();
  const auctions = await clip.activeAuctions();
  expect(auctions.length).toBeGreaterThan(0);
},10000);

test('active auction has a price', async () => {
  const clip = new clipper( 'ETH-A' );
  await clip.init();
  const auctions = await clip.activeAuctions();
  expect(auctions[0].price.toNumber()).toBeGreaterThanOrEqual(0);
},10000);

test('kick an auction and check that it is listed', () => {
  // generate an auction
});

test('kick an auction and check that it is listed', () => {
  //generate an auction, check that clipper saw it, take it, check that clipper removed it from
  // its active auction list
});

test('kick an auction and check its starting price', () => {

});


test('kick an auction check that its price decreases', () => {
  //make sure that clipper is able to calculate the price correctly using abacus
});


test('check order book', async () => {
  const oasis = new oasisDexAdaptor( Config.vars.collateral['ETH-A'].erc20addr );
  await oasis.fetch();
  expect(ethers.utils.formatUnits(await oasis.opportunity(ethers.utils.parseUnits('0.9')))).toBe('0.5');
},10000);
