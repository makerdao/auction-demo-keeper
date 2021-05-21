import { ethers } from 'ethers';
import network from './singleton/network.js';
import Config from './singleton/config.js';

export default class Multicall {

    _provider;
    _multi;
    _clipLinkA;
    _kicks;

    constructor() {
        this._provider = network.provider;
        this.init();
    }

    build = (address, name) => {
        return new ethers.Contract(
            address,
            require(`../abi/${name}.json`),
            this._provider
        );
    }

    init() {
        this._multi = this.build(Config.vars.multicall, 'Multicall');
        this._clipLinkA = this.build(Config.vars.collateral['LINK-A'].clipper, 'clipper');
    }

    getInfo = async (blockNumber) => {
        let linkA = this._multi.callStatic.aggregate([
            [Config.vars.collateral['LINK-A'].clipper, this._clipLinkA.interface.encodeFunctionData('calc')],
            [Config.vars.collateral['LINK-A'].clipper, this._clipLinkA.interface.encodeFunctionData('kicks')]
        ], { blockTag: blockNumber });

        let [block, res] = await linkA;

        console.log('blockNumber: ', block.toString());
        console.log('calc', this._clipLinkA.interface.decodeFunctionResult('calc', res[0]));
        this._kicks = this._clipLinkA.interface.decodeFunctionResult('kicks', res[1]).toString();
        console.log('kicks', this._kicks);

        return this._clipLinkA.interface.decodeFunctionResult('kicks', res[1]).toString();
    }
}