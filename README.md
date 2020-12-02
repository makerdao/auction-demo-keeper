# auction-demo-keeper

### Invocation

=======
The auction demo keeper is an implementation of the [Liq 2.0](https://forum.makerdao.com/t/liquidations-2-0-technical-summary/4632) contracts in Javascript. With this demo keeper we aim to showcase the simplicity of running a keeper on top of the Liq 2.0 mechanism of the Maker Protocol.

## Status

The current version of the keeper is work in progress. As a step to run the keeper, first there needs to be a testchain environment where the keeper could listen to new auctions being kicked by the liquidation system and at the same time look for oppportunities on the market to easily swap collateral for Dai. 

WIP:
- Testchain with snapshots (active auctions, market opportunities)
  
## Install

```bash
git clone https://github.com/makerdao/auction-demo-keeper.git && cd auction-demo-keeper && git submodule update --init --recursive
```

## Run

1 - Run testchain script: `yarn run testchain`  
2 - Run tests: `yarn run test`

