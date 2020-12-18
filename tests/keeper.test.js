/**
 * @jest-environment node
 */
import { ethers } from 'ethers';
import Config from '../src/singleton/config';
import network from '../src/singleton/network';
import {expect} from "@jest/globals";
import oasisDexAdaptor from '../src/dex/oasisdex';
import config from '../config/testchain.json';
import Clipper from "../src/clipper";
import Keeper from "../src/keeper";
import CreateAuction from "./createAuction.js";

network.rpcURL = 'http://localhost:2000';
Config.vars = config;


const sleep = async function(delay) {await new Promise((r) => setTimeout(r, delay));};

// Testchain Deployer Address
const privateKey = "0x474BEB999FED1B3AF2EA048F963833C686A0FBA05F5724CB6417CF3B8EE9697E";
const signer = new ethers.Wallet(privateKey, network.provider);
console.log("Address: " + signer.address);


test('keeper initialization, and one opportunity check loop', async () => {
  const keepr = new Keeper('http://localhost:2000', 'testchain');
  keepr.run();
  await sleep(8000);
  keepr.stop();
}, 10000);

test('basic connectivity', async () => {
  expect(typeof (await network.provider.getNetwork()).chainId).toBe('number');
});

test('read active auctions', async () => {
  const clip = new Clipper( 'ETH-A' );
  await clip.init();
  const auctions = await clip.activeAuctions();
  expect(auctions.length).toBeGreaterThan(0);
},10000);

test('active auction has a price', async () => {
  const clip = new Clipper('ETH-A');
  await clip.init();
  const auctions = await clip.activeAuctions();
  expect(auctions[0].price.toNumber()).toBeGreaterThanOrEqual(0);
},10000);

test('kick an auction and check that it is listed', async () => {
  const newAuction = new CreateAuction('ETH-A', 1, signer);
  await newAuction.startAuction();
}, 10000);

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
  const oasis = new oasisDexAdaptor( Config.vars.collateral['ETH-A'].erc20addr, Config.vars.collateral['ETH-A'].callee );
  await oasis.fetch();
  expect(ethers.utils.formatUnits(await oasis.opportunity(ethers.utils.parseUnits('0.9')))).toBe('0.5');
},10000);
