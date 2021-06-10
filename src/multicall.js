import { ethers } from 'ethers';
import network from './singleton/network.js';
import Config from './singleton/config.js';

export default class Multicall {

    _provider;
    _multi;
    _ilkRegistry;
    _ilks = [];
    _clipInterface;
    _kicks;
    _clippers = [];
    results = {

    }
    _activeAuctions = [];
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

    setActiveAuctionSearchPattern() {
        const searchPattern = this._clippers.map(clipper => {
            return [clipper.contract.address, clipper.contract.interface.encodeFunctionData('list')];
        });
        return searchPattern;
    }

    getActiveAuctions = async (blockNumber) => {
        const pattern = this.setActiveAuctionSearchPattern();
        const results = this._multi.callStatic.aggregate(pattern, { blockTag: blockNumber });
        const [block, res] = await results;
        this._activeAuctions = this._clippers.map((clipper, i) => {
            console.log(clipper.contract.interface.decodeFunctionResult('list', res[i])[0]);
            return { ilk: clipper.name, auctions: clipper.contract.interface.decodeFunctionResult('list', res[i])[0] };
        });
        console.log('active Auctions', this._activeAuctions);
        //active Auctions output [
        //    { ilk: 'LINK-A', auctions: [] },
        //    { ilk: 'YFI-A', auctions: [] },
        //    { ilk: 'WBTC-A', auctions: [] }
        //  ]
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


        // return this._clipLinkA.interface.decodeFunctionResult('kicks', res[1]).toString();
    }
}