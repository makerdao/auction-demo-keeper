/**
 * @jest-environment node
 */
import { ethers } from 'ethers';
import Config from '../src/singleton/config';
import network from '../src/singleton/network';
import { expect, it } from '@jest/globals';
import oasisDexAdaptor from '../src/dex/oasisdex';
import config from '../config/kovan.json';
import Clipper from '../src/clipper';
import Wallet from '../src/wallet';
import { Transact } from '../src/transact';
import daiAbi from '../abi/Dai.json';

network.rpcURL = 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a';
Config.vars = config;
console.log('network.rpcURL', network.provider);
console.log('CONFIG ', Config.vars);


const sleep = async function (delay) { await new Promise((r) => setTimeout(r, delay * 1000)); };

//  const privateKey = '0x474BEB999FED1B3AF2EA048F963833C686A0FBA05F5724CB6417CF3B8EE9697E';
// console.log('Network Provider: ', network.provider);
// const signer = new ethers.Wallet(privateKey, network.provider);
// console.log('Address: ' + signer.address);

test("Initializes the clipper and listen for active auctions", async () => {
  const clipper = new Clipper('LINK-A');

  // expect(clipper._collateral).toHaveLength();

  await clipper.init();
}, 100000)

test("reads an active auction and responds correctly if someone takes an auction", async () => {
  const clipper = new Clipper("LINK-A");

  await clipper.init();

 await clipper._takeListener;

  const auctions = await clipper.activeAuctions();

  console.log(`${BigInt(auctions[1].top)}`, 'Active auctions')

  console.log(`${BigInt(auctions[1].tab)}`, 'total dai to be raised')

}, 100000)