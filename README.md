# auction-demo-keeper

## Intro & Goal

*tl;dr - Integration example of a LIQ2.0 Keeper & its flash loan functionality*

Our goal is to make a Keeper that demonstrates most ways to interact with [LIQ2.0.]((https://forum.makerdao.com/t/liquidations-2-0-technical-summary/4632)) This "demo" keeper works out of the box, is simple in design, leverages LIQ2.0's flash loan feature, and therefore operates with minimal capital.

When paired with an [exchange-callee](https://github.com/makerdao/exchange-callees) contract, `auction-demo-keeper` utilizes the native flash loan feature within LIQ2.0, allowing it to borrow the collateral out for auction, swap it for DAI within an arbitrary DEX, return DAI to the auction, and collect a DAI profit from the spread - all in a single transaction. The keeper needs only ETH for gas to participate in LIQ2.0 auctions.

## Operation Diagram

![Operation Diagram](./diagram.jpeg)

## Who's it for

- Beginner Keepers - Looking for lightweight tool to begin participating in liquidations
- Experienced Keepers - Interested in incorporating LIQ2.0 in their proprietary infrastructure

## Why build it

- It's an educational resource that'll help keeper operators transition their systems from LIQ1.x to LIQ2.0
- Demonstrate novel, more capital efficient methods of LIQ2.0 participation
- Open source a LIQ2.0 Keeper that works out of the box

## Status

The current version of the keeper is work in progress. As a step to run the keeper, first there needs to be a testchain environment where the keeper could listen to new auctions being kicked by the liquidation system and at the same time look for oppportunities on the market to easily swap collateral for Dai.

## Configuring Keeper

The configuration of the Keeper is being done by puttong all the necessary parameters in config/kovan.json

- rpcUrl - rpcUrl stands for remote procedure call. This enables the keeper to connect to the  blockchain network  using the infura provider

- dai - This is the address of the dai contract on the kovan network
## How to Run:

```bash
cd auction-demo-keeper
node keeper.js
```

- running the node keeper.js will initialise everything in the keeper.js

### Install

```bash
git clone https://github.com/makerdao/auction-demo-keeper.git
cd auction-demo-keeper
yarn install
```

## Local Testing

1 - Run testchain script: `yarn testchain`  
2 - In a separate shell, run JS unit tests: `yarn test`
