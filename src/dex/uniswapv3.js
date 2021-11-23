import { ethers, BigNumber } from 'ethers';
import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import uniswapRouter from '../../abi/UniswapV3Router03.json';
import uniswapCalleeAbi from '../../abi/UniswapV3CalleeDai.json';
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { abi as QuoterABI } from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import { Token } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v3-sdk";

async function getPoolImmutables(_poolContract) {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
    await Promise.all([
      _poolContract.factory(),
      _poolContract.token0(),
      _poolContract.token1(),
      _poolContract.fee(),
      _poolContract.tickSpacing(),
      _poolContract.maxLiquidityPerTick(),
    ]);

  const immutables = {
    factory,
    token0,
    token1,
    fee,
    tickSpacing,
    maxLiquidityPerTick,
  };
  return immutables;
}

async function getPoolState(_poolContract) {
  // note that data here can be desynced if the call executes over the span of two or more blocks.
  const [liquidity, slot] = await Promise.all([
    _poolContract.liquidity(),
    _poolContract.slot0(),
  ]);

  const PoolState = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };

  return PoolState;
}

export default class UniswapAdaptor {
  _collateralName = '';
  _decNormalized;

  constructor(assetAddress, callee, collateralName) {
    this._provider = network.provider;
    this._asset = assetAddress;
    this._collateralName = collateralName;
    this._decNormalized = BigNumber.from('10').pow(
      18 - Config.vars.collateral[collateralName].decimals
    );
    this._callee = new ethers.Contract(
      callee, uniswapCalleeAbi, this._provider
    );
    this._uniswap = new ethers.Contract(
      Config.vars.UniswapV3Router, uniswapRouter, this._provider
    );
    this._quoter = new ethers.Contract(
      Config.vars.QuoterAddress, QuoterABI, this._provider
    );
  }

  // ilkAmount in WEI
  fetch = async (_ilkAmount) => {
    try {
      let book = {
        sellAmount: '',
        receiveAmount: ''
      };
      const ilkAmount = BigNumber.from(_ilkAmount).div(this._decNormalized);

      // TODO: figure this address out
      const poolAddress = "0xee815cdc6322031952a095c6cc6fed036cb1f70d";

      const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI,
        provider
      );

      // query the state and immutable variables of the pool
      const [immutables, state] = await Promise.all([
        getPoolImmutables(poolContract),
        getPoolState(poolContract),
      ]);
        
      // for (var i = 0; i < Config.vars.collateral[this._collateralName].uniswapRoute.length; i++) {
        const TokenA = new Token(
          3,
          Config.vars.collateral[this._collateralName].path.TokenA,
          18,                     // TODO: get from token
          "WETH",                 // TODO: get from token
          "Wrapped Ether"         // TODO: get from token
        );
        const TokenB = new Token(
          3,
          Config.vars.collateral[this._collateralName].path.TokenB, 
          18,                     // TODO: get from token
          "DAI",                  // TODO: get from token
          "Dai Stablecoin"        // TODO: get from token
        );

        // create an instance of the pool object for the given pool
        const pool = new Pool(
          TokenA,
          TokenB,
          Config.vars.collateral[this._collateralName].uniswapRoute[0].fee,
          state.sqrtPriceX96.toString(), //note the description discrepancy - sqrtPriceX96 and sqrtRatioX96 are interchangable values
          state.liquidity.toString(),
          state.tick
        );

        // create an instance of the route object in order to construct a trade object
        const swapRoute = new Route([pool], TokenA, TokenB);
      // }

      // // call the quoter contract to determine the amount out of a swap, given an amount in
      // const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
      //   immutables.token0,
      //   immutables.token1,
      //   immutables.fee,
      //   ilkAmount.toString(),
      //   0
      // );

      // // print the quote and the unchecked trade instance in the console
      // console.log("The quoted amount out is", quotedAmountOut.toString());

      const offer = await this._quoter.callStatic.quoteExactInput(
        swapRoute,
        ilkAmount 
      );

      // print the quote and the unchecked trade instance in the console
      console.log("The quoted amount out is", offer.toString());

      // TODO: change this to conform with v3
      // book.sellAmount = ethers.utils.formatUnits(
      //   offer[0].mul(this._decNormalized)
      // );
      // book.receiveAmount = ethers.utils.formatUnits(
      //   offer[offer.length - 1]
      // );
    } catch (e) {
      console.log(
        `Error fetching Uniswap amounts for ${this._collateralName}:`, e
      );
    }

    return book;
  }
}





// import { ethers } from "ethers";
// import { CurrencyAmount, Token, TradeType } from "@uniswap/sdk-core";
// import { Route } from "@uniswap/v3-sdk";
// import { Trade } from "@uniswap/v3-sdk";
// import { abi as QuoterABI } from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
// 
// const provider = new ethers.providers.JsonRpcProvider("<YOUR-ENDPOINT-HERE>");
// 
// 
// const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
// const quoterContract = new ethers.Contract(quoterAddress, QuoterABI, provider);
// 
// interface Immutables {
//   factory: string;
//   token0: string;
//   token1: string;
//   fee: number;
//   tickSpacing: number;
//   maxLiquidityPerTick: ethers.BigNumber;
// }
// 
// interface State {
//   liquidity: ethers.BigNumber;
//   sqrtPriceX96: ethers.BigNumber;
//   tick: number;
//   observationIndex: number;
//   observationCardinality: number;
//   observationCardinalityNext: number;
//   feeProtocol: number;
//   unlocked: boolean;
// }
// async function main() {
// 
//   // assign an input amount for the swap
//   const amountIn = 1500;
// 
//   // call the quoter contract to determine the amount out of a swap, given an amount in
//   const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
//     immutables.token0,
//     immutables.token1,
//     immutables.fee,
//     amountIn.toString(),
//     0
//   );
// 
//   // create an instance of the route object in order to construct a trade object
//   const swapRoute = new Route([poolExample], TokenA, TokenB);
// 
//   // create an unchecked trade instance
//   const uncheckedTradeExample = await Trade.createUncheckedTrade({
//     route: swapRoute,
//     inputAmount: CurrencyAmount.fromRawAmount(TokenA, amountIn.toString()),
//     outputAmount: CurrencyAmount.fromRawAmount(
//       TokenB,
//       quotedAmountOut.toString()
//     ),
//     tradeType: TradeType.EXACT_INPUT,
//   });
// 
//   // print the quote and the unchecked trade instance in the console
//   console.log("The quoted amount out is", quotedAmountOut.toString());
//   console.log("The unchecked trade object is", uncheckedTradeExample);
// }
// 
// main();