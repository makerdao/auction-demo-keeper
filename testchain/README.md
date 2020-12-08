# Testing on a local testchain

The collection of shell scripts herein may be used to set up a local testchain with all the contracts needed to test the `auction-demo-keeper`. The following contracts are deployed:
- [dss](https://github.com/makerdao/dss) (liq-2.0 branch)
- [maker-otc](https://github.com/daifoundation/maker-otc) (OasisDex)
- [oasis-liquidity-provider](https://github.com/daifoundation/oasis-liquidity-provider) (used to populate OasisDex)
- [exchange-callees](https://github.com/makerdao/exchange-callees)

Inspired from [makerdao/testchain](https://github.com/makerdao/testchain), this repo contains snapshots of chain state which preserve the above contracts and can be launched quickly on Ganache without any additional deployment or configuration.

These scripts can also be used to re-provision the testchain, update and add new snapshots.

## Installation and Requirements

The testing section of this repo inherits the requirements found in [`makerdao/testchain`](https://github.com/makerdao/testchain#installation-and-requirements). For your convenience, Ganache will be installed automatically on the first run on `build/run-testchain`. If you need to install Ganache manually, remember to `cd` into `auction-demo-keeper/lib/testchain`.

If you're wanting to create a new snapshot, `jq` is a requirement.

## Typical Usage

To run the testchain with the `default-auction-demo-keeper` snapshot, simply run:
```
./run-testchain
```
It will have a single live auction. For a full list of keeper-related contracts included in the `default-auction-demo-keeper` snapshot and relevant to the keeper, you can reference the contents in `/out`, which is generated from the provisioning script. Moreover, after initializing and updating git submodules (instructions below), you'll find addresses and ABIs for MCD (i.e. `dss`) and SCD in `node_modules/@makerdao/testchain/out`.

You're now able to implement `auction-demo-keeper` tests in `keeper.test.js` and run them against the testchain. If you need to connect to the testchain through `seth`, ensure the following env variables are set:
```
export ETH_GAS=${ETH_GAS:-"7000000"} # Ganache's default block gas limit
export SETH_STATUS=yes
export ETH_RPC_ACCOUNTS=yes # Don't use ethsign
export ETH_RPC_URL=http://127.1:2000
export ETH_FROM=$(seth rpc eth_coinbase)
```

## Creating a new snapshot

First, initialize the git submodules (will take a while):
```
git submodule update --init --recursive
```

Then re-provision the testchain and create a new snapshot by calling:
```
./build-testchain -s $SNAPSHOT_NAME
```
If an instance of `$SNAPSHOT_NAME` already exists in `snapshots` (this includes `default-auction-demo-keeper`), this script will overwrite the old snapshot with the newer one.

## Misc

More information on how to access the deployer address can be found [here](https://github.com/makerdao/testchain#deployer-account).



