import { ethers, BigNumber } from 'ethers';
import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import uniswapRouter from '../../abi/UniswapV3Router03.json';
import uniswapV3CalleeAbi from '../../abi/UniswapV3CalleeDai.json';
import factory from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json";
import uniV3Pool from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import { Token } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v3-sdk";

async function getPoolState(_poolContract) {
  // Data here can be desynced if the call executes over the span of two or
  // more blocks.
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

export default class UniswapV3Adaptor {
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
      callee, uniswapV3CalleeAbi, this._provider
    );
    this._uniswap = new ethers.Contract(
      Config.vars.UniswapV3Router, uniswapRouter, this._provider
    );
    this._factory = new ethers.Contract(
      Config.vars.UniswapV3FactoryAddress, factory.abi, this._provider
    );
    this._quoter = new ethers.Contract(
      Config.vars.UniswapV3QuoterAddress, quoter.abi, this._provider
    );
  }

  // ilkAmount in WEI
  fetch = async (_ilkAmount) => {
    let book = {
      sellAmount: '',
      receiveAmount: ''
    };

    try {
      const ilkAmount = BigNumber.from(_ilkAmount).div(this._decNormalized);

      let i = 0;
      // for (let i = 0; i < Config.vars.collateral[this._collateralName].uniV3Path.length; i++) {
        // TODO: figure this address out
        const poolAddress = await this._factory.getPool(
          Config.vars.collateral[this._collateralName].uniV3Path[i].tokenA,
          Config.vars.collateral[this._collateralName].uniV3Path[i].tokenB,
          Config.vars.collateral[this._collateralName].uniV3Path[i].fee, 
        );

        const poolContract = new ethers.Contract(
          poolAddress,
          uniV3Pool.abi,
          this._provider
        );

        // query the state and immutable variables of the pool
        const state = await getPoolState(poolContract);
        
        const TokenA = new Token(
          3,
          Config.vars.collateral[this._collateralName].uniV3Path[i].tokenA,
          18,                     // TODO: get from token
          "WETH",                 // TODO: get from token
          "Wrapped Ether"         // TODO: get from token
        );
        const TokenB = new Token(
          3,
          Config.vars.collateral[this._collateralName].uniV3Path[i].tokenB, 
          18,                     // TODO: get from token
          "DAI",                  // TODO: get from token
          "Dai Stablecoin"        // TODO: get from token
        );

        // create an instance of the pool object for the given pool
        const pool = new Pool(
          TokenA,
          TokenB,
          Config.vars.collateral[this._collateralName].uniV3Path[i].fee,
          state.sqrtPriceX96.toString(), //note the description discrepancy - sqrtPriceX96 and sqrtRatioX96 are interchangable values
          state.liquidity.toString(),
          state.tick
        );

        // create an instance of the route object in order to construct a trade object
        // const swapRoute = new Route([pool], TokenA, TokenB);
      // }

      // call the quoter contract to determine the amount out of a swap, given an amount in
      const quotedAmountOut = await this._quoter.callStatic.quoteExactInputSingle(
        Config.vars.collateral[this._collateralName].uniV3Path[i].tokenA,
        Config.vars.collateral[this._collateralName].uniV3Path[i].tokenB,
        Config.vars.collateral[this._collateralName].uniV3Path[i].fee ,
        ilkAmount,
        0
      );

      // const offer = await this._quoter.callStatic.quoteExactInput(
      //   swapRoute,
      //   ilkAmount 
      // );

      // print the quote and the unchecked trade instance in the console
      // console.log("The quoted amount out is", offer.toString());
      // console.log("The quoted amount out is", quotedAmountOut.toString());

      book.sellAmount = ethers.utils.formatUnits(
        ilkAmount.mul(this._decNormalized)
      );
      book.receiveAmount = ethers.utils.formatUnits(quotedAmountOut);
    } catch (e) {
      console.log(
        `Error fetching Uniswap amounts for ${this._collateralName}:`, e
      );
    }

    return book;
  }
}
