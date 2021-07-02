/**
 * @jest-environment node
 */
import { ethers } from "ethers";
import Config from "../src/singleton/config";
import network from "../src/singleton/network";
import { expect, it } from "@jest/globals";
import oasisDexAdaptor from "../src/dex/oasisdex";
import config from "../config/kovan.json";
import Clipper from "../src/clipper";
import Wallet from "../src/wallet";
import { Transact } from "../src/transact";
import daiAbi from "../abi/Dai.json";

network.rpcURL = "https://kovan.infura.io/v3/11465e3f27b247eb8b785c23047b29fd";
Config.vars = config;
// console.log("network.rpcURL", network.provider);
// console.log("CONFIG ", Config.vars);

const sleep = async function (delay) {
  await new Promise((r) => setTimeout(r, delay * 1000));
};

const privateKey = '0x474BEB999FED1B3AF2EA048F963833C686A0FBA05F5724CB6417CF3B8EE9697E';
// console.log('Network Provider: ', network.provider);
const signer = new ethers.Wallet(privateKey, network.provider);
// console.log('Address: ' + signer.address);

test("Initializes the clipper and listen for active auctions", async () => {
  const clipper = new Clipper("LINK-A");

  await clipper.init();

  expect(clipper).toBeDefined();
}, 100000);

//test("Read active auctions", async () => {
//  const clipper = new Clipper("LINK-A");
//
//  await clipper.init();
//
//  const auctions = await clipper.activeAuctions();
//
//  expect(auctions.length).toBeGreaterThan(0);
//
//  console.log(auctions, "auctions");
//
//  console.log(`${BigInt(auctions[0].top)}`, "Starting Price");
//
//  console.log(`${BigInt(auctions[0].tab)}`, "Total dai to be raised");
//
//  console.log(`${BigInt(auctions[0].tic)}`, "Auction start time");
//
//  console.log(auctions[0].usr, "Liquidated CDP");
//
//  console.log(`${BigInt(auctions[0].lot)}`, "Collateral to sell");
//}, 100000);
//
//test("Get signer from wallet and Execute an auction ", async () => {
//  const clipper = new Clipper("LINK-A");
//
//  await clipper.init();
//
//  const auctions = await clipper.activeAuctions();
//
//  const auction = auctions[0];
//
//  const wallet = new Wallet("./jsonpassword.txt", "./testwallet.json");
//
//  const jsonWallet = await wallet.getWallet();
//
//  // get signer from json wallet
//  const signer = new ethers.Wallet(jsonWallet, network.provider);
//
//  console.log(Config.vars.collateral["LINK-A"], "COLLATERAL");
//
//  const _gemJoinAdapter = Config.vars.collateral["LINK-A"].joinAdapter;
//
//  const priceWithProfit = auction.price * Config.vars.minProfitPercentage;
//
//  const _minProfit = priceWithProfit * auction.lot;
//
//  const exhangeCallee = Config.vars.collateral["LINK-A"].uniswapCallee;
//
//  let account = jsonWallet.address;
//
//  console.log(exhangeCallee, _gemJoinAdapter, account);
//
//  await clipper.execute(
//    BigInt(auction.id),
//    BigInt(auction.lot),
//    BigInt(auction.price),
//    BigInt(_minProfit),
//    account,
//    _gemJoinAdapter,
//    signer,
//    exhangeCallee
//  );
//
//}, 100000);
