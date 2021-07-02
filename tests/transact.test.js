/**
 * @jest-environment node
 */
import { ethers } from 'ethers';
import Config from '../src/singleton/config';
import network from '../src/singleton/network';
import { expect } from '@jest/globals';
import config from '../config/testchain.json';
import { Transact, GeometricGasPrice } from '../src/transact';
import daiAbi from '../abi/Dai.json';

network.rpcURL = 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a';
Config.vars = config;

// Testchain Deployer Address
const privateKey = '0x474BEB999FED1B3AF2EA048F963833C686A0FBA05F5724CB6417CF3B8EE9697E';
const signer = new ethers.Wallet(privateKey, network.provider);
// console.log('Address: ' + signer.address);

// https://github.com/makerdao/pymaker/blob/634291f12fc8c858c2c40379d114f0b87f1832c5/tests/test_gas.py#L166
test('txn-manager: GeometricGasPrice should increase with time', async () => {
    // given 100 wei initial price, increasing every 20 seconds
    const gasStrategy = new GeometricGasPrice(100, 10);

    // expect
    expect(gasStrategy.get_gas_price(0)).toBe(100);
    expect(gasStrategy.get_gas_price(1)).toBe(100);
    expect(gasStrategy.get_gas_price(10)).toBe(113);
    expect(gasStrategy.get_gas_price(15)).toBe(113);
    expect(gasStrategy.get_gas_price(20)).toBe(127);
    expect(gasStrategy.get_gas_price(30)).toBe(143);
    expect(gasStrategy.get_gas_price(50)).toBe(181);
    expect(gasStrategy.get_gas_price(100)).toBe(325);

}, 25000);

// https://github.com/makerdao/pymaker/blob/634291f12fc8c858c2c40379d114f0b87f1832c5/tests/test_gas.py#L180
//test('txn-manager: GeometricGasPrice should obey max value', async () => {
//    // given 1000 wei initial price, increasing every 60 seconds, 12.5% bump, 2500 wei max
//    const gasStrategy = new GeometricGasPrice(1000, 60, 1.125, 2500);
//
//    // expect
//    expect(gasStrategy.get_gas_price(0)).toBe(1000);
//    expect(gasStrategy.get_gas_price(1)).toBe(1000);
//    expect(gasStrategy.get_gas_price(59)).toBe(1000);
//    expect(gasStrategy.get_gas_price(60)).toBe(1125);
//    expect(gasStrategy.get_gas_price(119)).toBe(1125);
//    expect(gasStrategy.get_gas_price(120)).toBe(1266);
//    expect(gasStrategy.get_gas_price(1200)).toBe(2500);
//    expect(gasStrategy.get_gas_price(3000)).toBe(2500);
//    expect(gasStrategy.get_gas_price(1000000)).toBe(2500);
//
//}, 25000);
//
//// https://github.com/makerdao/pymaker/blob/634291f12fc8c858c2c40379d114f0b87f1832c5/tests/test_gas.py#L195
//test('txn-manager: GeometricGasPrice behaves with realistic values', async () => {
//    // given
//    const GWEI = 1000000000;
//    const gasStrategy = new GeometricGasPrice(100 * GWEI, 10, 1 + (0.125 * 2));
//
//    const cycles = [0, 1, 10, 12, 30, 60];
//    cycles.forEach(seconds => {
//        console.log(`Gas price after ${seconds} seconds is ${gasStrategy.get_gas_price(seconds) / GWEI}`);
//    });
//
//    // expect
//    expect(Math.round(gasStrategy.get_gas_price(0) / GWEI)).toBe(100);
//    expect(Math.round(gasStrategy.get_gas_price(1) / GWEI)).toBe(100);
//    expect(Math.round(gasStrategy.get_gas_price(10) / GWEI)).toBe(125);
//    expect(Math.round(gasStrategy.get_gas_price(12) / GWEI)).toBe(125);
//    expect(Math.round(gasStrategy.get_gas_price(30) / GWEI)).toBe(195);
//    expect(Math.round(gasStrategy.get_gas_price(60) / GWEI)).toBe(381);
//
//}, 25000);
//
//
//test('txn-manager: try transaction wth node gasStrategy', async () => {
//    const dai = new ethers.Contract(Config.vars.dai, daiAbi, signer.provider);
//    const approval_transaction = await dai.populateTransaction.approve(Config.vars.OasisDex, ethers.utils.parseEther('1.0'));
//    const txn = new Transact(approval_transaction, signer, Config.vars.txnReplaceTimeout);
//    await txn.transact_async();
//}, 25000);
//
//test('txn-manager: try transaction w/ geometric gasStrategy', async () => {
//
//    const dai = new ethers.Contract(Config.vars.dai, daiAbi, signer.provider);
//    const approval_transaction = await dai.populateTransaction.approve(Config.vars.OasisDex, ethers.utils.parseEther('1.0'));
//    const initial_price = await signer.getGasPrice();
//    const gasStrategy = new GeometricGasPrice(initial_price.toNumber(), Config.vars.txnReplaceTimeout, Config.vars.dynamicGasCoefficient, Config.vars.maxGasPrice);
//    const txn = new Transact(approval_transaction, signer, Config.vars.txnReplaceTimeout, gasStrategy);
//    await txn.transact_async();
//
//}, 25000);
