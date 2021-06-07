import { ethers } from 'ethers';
import network from './singleton/network.js';
import Config from './singleton/config.js';

export default class Multicall {

    _provider;
    _multi;
    _ilkRegistry;
    _ilks = [];
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
        this._ilkRegistry = this.build(Config.vars.ilkRegistry, 'IlkRegistry');
        this._clipLinkA = this.build(Config.vars.collateral['LINK-A'].clipper, 'clipper');
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

    setSearchPattern() {
        for (const name in Config.vars.collateral) {
            if (Object.prototype.hasOwnProperty.call(Config.vars.collateral, name)) {
                const collateral = Config.vars.collateral[name];
                let ilkbytes32 = ethers.utils.formatBytes32String(collateral.name);
                this._ilks.push({ ilkRegistryAddr: Config.vars.ilkRegistry, ilkbytes32, ilkName: collateral.name });
            }
        }

        let searchPattern = this._ilks.map(ilk => {
            return [ilk.ilkRegistryAddr, this._ilkRegistry.interface.encodeFunctionData('xlip', [ilk.ilkbytes32])];
        });

        return searchPattern;
    }

    updateClipperAddresses = async (blockNumber) => {
        let pattern = this.setSearchPattern();
        let results = this._multi.callStatic.aggregate(pattern, { blockTag: blockNumber });
        let [block, res] = await results;

        this._ilks = this._ilks.map((ilk, i) => {
            return { ...ilk, clipper: this._ilkRegistry.interface.decodeFunctionResult('xlip', res[i])[0] };
        });

        this._ilks.map(ilk => {
            if (ilk.ilkName === Config.vars.collateral[ilk.ilkName]) {
                Config.vars.collateral[ilk.ilkName].clipper = ilk.clipper;
            }
        });

    }
    getInfo = async (blockNumber) => {

        // let linkA = this._multi.callStatic.aggregate([
        //     [Config.vars.collateral['LINK-A'].clipper, this._clipLinkA.interface.encodeFunctionData('calc')],
        //     [Config.vars.collateral['LINK-A'].clipper, this._clipLinkA.interface.encodeFunctionData('kicks')],
        //     [Config.vars.ilkRegistry, this._ilkRegistry.interface.encodeFunctionData('xlip', ['0x4c494e4b2d410000000000000000000000000000000000000000000000000000'])]
        // ], { blockTag: blockNumber });



        // let [block, res] = await linkA;

        // console.log('blockNumber: ', block.toString());
        // console.log('calc', this._clipLinkA.interface.decodeFunctionResult('calc', res[0]));
        // console.log('clipperAddress', this._clipLinkA.interface.decodeFunctionResult('xlip', res[2]));
        // this._kicks = this._clipLinkA.interface.decodeFunctionResult('kicks', res[1]).toString();
        // console.log('kicks', this._kicks);
        // console.log('results:', res);


        return this._clipLinkA.interface.decodeFunctionResult('kicks', res[1]).toString();
    }
}