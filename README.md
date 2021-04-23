# Auction-Demo-Keeper

*Integration example of a LIQ2.0 Keeper with flash loan functionality*

The Auction-Demo-Keeper is an integration example that demonstrates most ways to interact with the [LIQ-2.0]((https://forum.makerdao.com/t/liquidations-2-0-technical-summary/4632)) auction system in the Maker Protocol.
This "demo" keeper works out of the box, it is simple in design, leverages LIQ-2.0's flash loan feature, and therefore operates with minimal capital requirements.

When paired with an [exchange-callee](https://github.com/makerdao/exchange-callees) contract, `auction-demo-keeper` utilizes the native flash loan feature within LIQ2.0, allowing it to borrow the collateral out for auction, swap it for DAI within an arbitrary DEX, return DAI to the auction, and collect a DAI profit from the spread - all in a single transaction. The keeper needs only ETH for gas to participate in LIQ2.0 auctions.

## Scope

- It's an educational resource that'll help keeper operators transition their systems from LIQ1.2 to LIQ2.0
- Demonstrate novel, more capital efficient methods of LIQ2.0 participation
- An open source LIQ-2.0 Keeper that works out of the box

## Who's it for

- Beginner Keepers - Looking for lightweight tool to begin participating in liquidations
- Experienced Keepers - Interested in incorporating LIQ2.0 in their proprietary infrastructure

## Status
- As of March 23, the Auction Demo Keeper is still in active development, and is not yet fully functional.

## Operation Diagram

![Operation Diagram](./diagram.jpeg)

## Core Modules
### keeper.js

The Keeper module is the entry point for the Auction Demo Keeper. It is responsible for initializing the clipper and constructing the different exchange contracts e.g. Uniswap, Oasis
### clipper.js

The Clipper module is responsible for auction inititation. It listens for active auctions and gets the details of all active auctions. Based on the details of active auctions like collaterals remaining and auction state, the clipper executes the auction using the `Transact` Module.

### transact.js

The Transact module handles calculation of gas costs, signing and sending of transactions. It also has a major class called `GeometricGasPrice` which is used to get a geometric gas price that increases geometrically with respect to time and the fixed coefficient

## Installation

```bash
git clone https://github.com/makerdao/auction-demo-keeper.git
cd auction-demo-keeper
yarn install
```

## Configuring Keeper

The configuration of the Keeper is being done by putting all the necessary parameters in config/kovan.json

## Parameters

- `rpcUrl` - rpcUrl stands for remote procedure call. This enables the keeper to connect to the  blockchain network  using the infura provider

- `MakerOTCSupportMethods` - This is the address of the helper contract for oasisDex

- `OasisDex` - This is the address of the oasis exchange contract

- `UniswapV2Router` - This is the address of uniswap v2 router contract

- `collateral` - This takes in an object for the collateral path "LINK-A" and "ETH-A"

- `txnReplaceTimeout` - Timeout in seconds for the transaction replacement 

- `delay` - Delay period in seconds

- `dynamicGasCoefficient` - This is a value that is needed to get a geometric gas price. It's default value is 1.125 (12.5%) which is the minimum increase for Parity to replace a transaction

- `maxGasPrice` - Max gas price that the geometric gas price calculator uses in wei

- `minProfitPercentage` - Minimum percentage arbitrage profits the Keeper should execute

## Generate Auctions

To generate auctions you need to run `scripts/create-auctions.js` file. Before you do that howver, add:

- Private key in the script file
- Acquire tokens from the FAUCET contract

Then run `node /scripts/create-auctions.js`

## How To Run

### Setup wallet

This keeper needs a json wallet and a password.txt file located at `/wallet` folder. It has a test wallet already setup for testing pusposes. To generate json wallet key use tools such as [MyCrypto.com](https://mycrypto.com/).  Change wallet to your personal one for running keeper with your own wallet.  

```bash
cd auction-demo-keeper

yarn install

yarn run kovan
or
yarn run mainnet
```

## Local Testing

1 - Run testchain script: `yarn testchain`  
2 - In a separate shell, run JS unit tests: `yarn test`

## Disclaimer

YOU (MEANING ANY INDIVIDUAL OR ENTITY ACCESSING, USING OR BOTH THE SOFTWARE INCLUDED IN THIS GITHUB REPOSITORY) EXPRESSLY UNDERSTAND AND AGREE THAT YOUR USE OF THE SOFTWARE IS AT YOUR SOLE RISK. THE SOFTWARE IN THIS GITHUB REPOSITORY IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. YOU RELEASE AUTHORS OR COPYRIGHT HOLDERS FROM ALL LIABILITY FOR YOU HAVING ACQUIRED OR NOT ACQUIRED CONTENT IN THIS GITHUB REPOSITORY. THE AUTHORS OR COPYRIGHT HOLDERS MAKE NO REPRESENTATIONS CONCERNING ANY CONTENT CONTAINED IN OR ACCESSED THROUGH THE SERVICE, AND THE AUTHORS OR COPYRIGHT HOLDERS WILL NOT BE RESPONSIBLE OR LIABLE FOR THE ACCURACY, COPYRIGHT COMPLIANCE, LEGALITY OR DECENCY OF MATERIAL CONTAINED IN OR ACCESSED THROUGH THIS GITHUB REPOSITORY.
