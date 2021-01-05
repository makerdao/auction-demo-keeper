# auction-demo-keeper

## Intro & Goal

*tl;dr - Integration example of LIQ2.0 & flash loan functionality therein*

Our goal is to make a Keeper that demonstrates most ways to interact with [LIQ2.0.]((https://forum.makerdao.com/t/liquidations-2-0-technical-summary/4632)) This "demo" keeper will work out of the box, be simple in design, and will be adequately documented. Since we cannot make assumptions on the availability of open source keepers supporting LIQ2.0, the reference keeper must be functional and capital efficient, though not built for performance. Albeit complex, LIQ2.0's innovation is the compatibility with flash loans, which will be a supported feature in the keeper.

## Operation Diagram

![Operation Diagram](./diagram.jpeg)

## Who's it for

- Perspective Auction Keepers - Interested in incorporating LIQ2.0 in their proprietary infra

## Why build it

- It's an educational resource that'll help keeper operators to transition their systems from LIQ1.x to LIQ2.0
- Demonstrate novel, more capital efficient methods of LIQ2.0 participation
- We need a keeper for LIQ2.0 that works out of the box

## Status

The current version of the keeper is work in progress. As a step to run the keeper, first there needs to be a testchain environment where the keeper could listen to new auctions being kicked by the liquidation system and at the same time look for oppportunities on the market to easily swap collateral for Dai.
  
## Install

```bash
git clone https://github.com/makerdao/auction-demo-keeper.git && cd auction-demo-keeper && git submodule update --init --recursive
```

## Run

1 - Run testchain script: `yarn run testchain`  ( Run with node version  `12.-.-` for a working version)  
2 - In a separate shell run tests: `yarn run test`
