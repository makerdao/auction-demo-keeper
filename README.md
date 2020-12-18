# auction-demo-keeper

## Intro & Goal

*tl;dr - Integration example of a LIQ2.0 Keeper & its flash loan functionality*

Our goal is to make a Keeper that demonstrates most ways to interact with [LIQ2.0.]((https://forum.makerdao.com/t/liquidations-2-0-technical-summary/4632)) This "demo" keeper works out of the box, is simple in design, leverages LIQ2.0's flash loan feature, and therefore operates with minimal capital.

When paired with an [exchange-callee](https://github.com/makerdao/exchange-callees) contract, `auction-demo-keeper` utilizes the native flash loan feature within LIQ2.0, allowing it to borrow the collateral out for auction, swap it for DAI within an arbitrary DEX, return DAI to the auction, and collect a DAI profit from the spread - all in a single transaction. The keeper needs only ETH for gas to participate in LIQ2.0 auctions.

## Operation Diagram

![Operation Diagram](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/9e1349f9-0316-4814-af2b-0075de502fed/Auction-Demo-Keeper_Operation.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAT73L2G45O3KS52Y5%2F20201202%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20201202T160238Z&X-Amz-Expires=86400&X-Amz-Signature=d4837a1e8018f358a489459cb4d20799df5298c7271d09b6e557484658f93f71&X-Amz-SignedHeaders=host&response-content-disposition=filename%20%3D%22Auction-Demo-Keeper_Operation.jpeg%22)

## Who's it for

- Beginner Keepers - Looking for lightweight tool to begin participating in liquidations
- Experienced Keepers - Interested in incorporating LIQ2.0 in their proprietary infrastructure

## Why build it

- It's an educational resource that'll help keeper operators transition their systems from LIQ1.x to LIQ2.0
- Demonstrate novel, more capital efficient methods of LIQ2.0 participation
- Open source a LIQ2.0 Keeper that works out of the box

## Status

The current version of the keeper is work in progress. As a step to run the keeper, first there needs to be a testchain environment where the keeper could listen to new auctions being kicked by the liquidation system and at the same time look for oppportunities on the market to easily swap collateral for Dai.

## How to Run:

### Install

```bash
git clone https://github.com/makerdao/auction-demo-keeper.git
cd auction-demo-keeper
yarn install
```

## Local Testing

1 - Run testchain script: `yarn testchain`  
2 - In a separate shell, run JS unit tests: `yarn test`
