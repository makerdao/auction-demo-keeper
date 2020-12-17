# auction-demo-keeper

## Intro & Goal

*tl;dr - Integration example of LIQ2.0 & flash loan functionality therein*

Our goal is to make a Keeper that demonstrates most ways to interact with [LIQ2.0.]((https://forum.makerdao.com/t/liquidations-2-0-technical-summary/4632)) This "demo" keeper will work out of the box, be simple in design, and will be adequately documented. Since we cannot make assumptions on the availability of open source keepers supporting LIQ2.0, the reference keeper must be functional and capital efficient, though not built for performance. Albeit complex, LIQ2.0's innovation is the compatibility with flash loans, which will be a supported feature in the keeper.

## Operation Diagram

![Operation Diagram](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/9e1349f9-0316-4814-af2b-0075de502fed/Auction-Demo-Keeper_Operation.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAT73L2G45O3KS52Y5%2F20201210%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20201210T154639Z&X-Amz-Expires=86400&X-Amz-Signature=624eac48ae4f83817c154ef4aa46d8a806835b20345ab5c0b1490d64e4de3e28&X-Amz-SignedHeaders=host&response-content-disposition=filename%20%3D%22Auction-Demo-Keeper_Operation.jpeg%22)

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

1 - Run testchain script: `yarn run testchain`  
2 - In a separate shell run tests: `yarn run test`
