import Config from '../singleton/config.js';
import network from '../singleton/network.js';
import { ethers, BigNumber } from 'ethers';
import uniswapRouter from '../../abi/UniswapV2Router02.json' assert {type: 'json'};
import uniswapCalleeAbi from '../../abi/UniswapV2CalleeDai.json' assert {type: 'json'};
import UniswapV2Pair from '../../abi/UniswapV2Pair.json' assert {type: 'json'};

const decimals18 = ethers.utils.parseEther('1');

export default class UniswapV2Adaptor {
  _collateralName = '';
  _decNormalized;
  _decNormalized0 = BigNumber.from('10').pow(18);
  _decNormalized1 = BigNumber.from('10').pow(18);

  constructor(assetAddress, callee, collateralName) {
    this._provider = network.provider;
    this._asset = assetAddress;
    this._collateralName = collateralName;
    this._decNormalized = BigNumber.from('10').pow(
      18 - Config.vars.collateral[collateralName].decimals
    );
    if (typeof(Config.vars.collateral[this._collateralName].token0) !== 'undefined') {
      this._decNormalized0 = BigNumber.from('10').pow(
        18 - Config.vars.collateral[collateralName].token0.decimals
      );
      this._decNormalized1 = BigNumber.from('10').pow(
        18 - Config.vars.collateral[collateralName].token1.decimals
      );
    }
    this._callee = new ethers.Contract(
      callee, uniswapCalleeAbi, this._provider
    );
    this._uniswap = new ethers.Contract(
      Config.vars.UniswapV2Router, uniswapRouter, this._provider
    );
  }

  // ilkAmount in WEI
  fetch = async (_ilkAmount) => {
    let ilkAmount = BigNumber.from(_ilkAmount).div(this._decNormalized);
    let book = {
      sellAmount: '',
      receiveAmount: ''
    };
    try {
      const blockNumber = await this._provider.getBlockNumber();

      if (typeof(Config.vars.collateral[this._collateralName].token0) !== 'undefined') {
        const token = new ethers.Contract(
          Config.vars.collateral[this._collateralName].erc20addr,
          UniswapV2Pair,
          this._provider
        );
        const totalSupply = await token.totalSupply();
        const share = ilkAmount.mul(decimals18).div(totalSupply);
        const reserves = await token.getReserves();

        // normalize reserves for each tokens decimals
        let ilkAmount0 = reserves[0].mul(share).div(decimals18);
        let ilkAmount1 = reserves[1].mul(share).div(decimals18);
        // debug
        // let ilkAmount0 = BigNumber.from('10').pow(24); // 1 million
        // let ilkAmount1 = BigNumber.from('10').pow(24); // 1 million
        // console.log(
        //   'ilkAmount0: ' +
        //   ethers.utils.formatUnits(
        //     ilkAmount0,
        //     Config.vars.collateral[this._collateralName].token0.decimals
        //   )
        // );
        // console.log(
        //   'ilkAmount1: ' +
        //   ethers.utils.formatUnits(
        //     ilkAmount1,
        //     Config.vars.collateral[this._collateralName].token1.decimals
        //   )
        // );

        let offer0 = [ilkAmount0];
        let offer1 = [ilkAmount1];

        if (Config.vars.collateral[this._collateralName].token0.name !== 'DAI') {
          offer0 = await this._uniswap.getAmountsOut(
            ilkAmount0,
            Config.vars.collateral[this._collateralName].token0.route
          );
        }
        if (Config.vars.collateral[this._collateralName].token1.name !== 'DAI') {
          offer1 = await this._uniswap.getAmountsOut(
            ilkAmount1,
            Config.vars.collateral[this._collateralName].token1.route
          );
        }

        book.sellAmount = ethers.utils.formatUnits(
          ilkAmount.mul(this._decNormalized)
        );
        book.receiveAmount = ethers.utils.formatUnits(
          offer0[offer0.length - 1].add(offer1[offer1.length - 1])
        );
      } else {
        const offer = await this._uniswap.getAmountsOut(
          ilkAmount, Config.vars.collateral[this._collateralName].uniswapRoute
        );
        book.sellAmount = ethers.utils.formatUnits(
          offer[0].mul(this._decNormalized)
        );
        book.receiveAmount = ethers.utils.formatUnits(
          offer[offer.length - 1]
        );
      }
    } catch (e) {
      console.log(
        `Error fetching Uniswap amounts for ${this._collateralName}:`, e
      );
    }

    return book;
  }
}
