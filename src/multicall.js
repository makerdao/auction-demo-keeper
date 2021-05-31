import { ethers } from 'ethers';
import network from './singleton/network.js';
import Config from './singleton/config.js';

export default class Multicall {

    _provider;
    _multi;
    _clipLinkA;
    _kicks;
    _clippers = [];
    results = {

    }
    // TODO
    // look at ilkRegistry - check Clippers - list/iterate - > grab xlap element
    // query each clipper active auctions
    // for each acction grab action details...
    // hybrid of multicall/events - check for events and update auction state

    // TODO
    // automatically update config.json with latest contract addresses.

    // TODO
    // Update config.json ILK CLipper addresses with ilk_registry
    // get xlip of each listed collateral in config
    // update config with latest clip address 
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
        console.log('clippers', this._clippers);
    }

    setupClipperContracts() {
        for (const name in Config.vars.collateral) {
            if (Object.prototype.hasOwnProperty.call(Config.vars.collateral, name)) {
                const collateral = Config.vars.collateral[name];
                let clipContract = this.build(collateral.clipper, 'clipper');
                this._clippers.push({ name: collateral.name, contract: clipContract });
            }
        }
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