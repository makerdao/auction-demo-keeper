# auction-demo-keeper

## Intro & Goal

Our goal is to make a Keeper that demonstrates most ways to interact with [LIQ2.0.]((https://forum.makerdao.com/t/liquidations-2-0-technical-summary/4632)) This "demo" keeper will work out of the box, be simple in design, though not built for performance and will be adequately documented. Albeit complex, LIQ2.0's innovation is the compatibility with flash loans, which will be a supported feature in the keeper.

## Operation Diagram

![Operation Diagram](./diagram.jpeg)

## Who's it for

- Perspective Auction Keepers - Interested in incorporating LIQ2.0 in their proprietary infrastructure.

## Why build it

- It's an educational resource that'll help keeper operators transition their systems from LIQ1.x to LIQ2.0
- Demonstrate novel, more capital efficient methods of LIQ2.0 participation
- We need a keeper for LIQ2.0 that works out of the box

## Status

The current version of the keeper is work in progress. As a step to run the keeper, first there needs to be a testchain environment where the keeper could listen to new auctions being kicked by the liquidation system and at the same time look for oppportunities on the market to easily swap collateral for Dai.

## Future improvements

1. Consider the gas costs of the smart contract function calls while evaluating the opportunity's profit. 

## Install

```bash
git clone https://github.com/makerdao/auction-demo-keeper.git && cd auction-demo-keeper && git submodule update --init --recursive
```

## Run

1 - Run testchain script: `yarn run testchain`  ( Run with node version  `12.-.-` for a working version)  
2 - In a separate shell run tests: `yarn run test`
