import { ethers, BigNumber } from 'ethers';
import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import uniswapRouter from '../../abi/UniswapV3Router03.json';
import uniswapV3CalleeAbi from '../../abi/UniswapV3CalleeDai.json';
import factory from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json";
import quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";

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
      let quotedAmountOut = BigNumber.from(_ilkAmount).div(this._decNormalized);

      for (let i = 0; i < Config.vars.collateral[this._collateralName].uniV3Path.length; i++) {
        // call the quoter contract to determine the amount out of a swap
        quotedAmountOut = await this._quoter.callStatic.quoteExactInputSingle(
          Config.vars.collateral[this._collateralName].uniV3Path[i].tokenA,
          Config.vars.collateral[this._collateralName].uniV3Path[i].tokenB,
          Config.vars.collateral[this._collateralName].uniV3Path[i].fee ,
          quotedAmountOut,
          0
        );
      }

      book.sellAmount = ethers.utils.formatUnits(_ilkAmount);
      book.receiveAmount = ethers.utils.formatUnits(quotedAmountOut);
    } catch (e) {
      console.log(
        `Error fetching Uniswap amounts for ${this._collateralName}:`, e
      );
    }

    return book;
  }
}
