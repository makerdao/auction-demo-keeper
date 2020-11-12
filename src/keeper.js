import oasisDexAdaptor from './dex/oasisdex';
import config from '../config/mainnet.json';
import Config from './singleton/config';
import network from './singleton/network';
import clipper from './clipper';

let _this;
export default class keeper {
  _clippers = [];

  constructor ( rpcUrl ) {
    config.rpcURL = rpcUrl;
    Config.vars = config;
    network.rpcURL = rpcUrl;
    _this=this;
  }

  _opportunityCheck ( oasis, clip ) {
    Promise.all( [oasis.fetch(), clip.activeAuctions()] ).then( (res) => {
      const activeAuctions = res[1];
      //{ top, tab, lot, id, usr, tic, price }
      activeAuctions.forEach( auction => {
        const size = oasis.opportunity(auction.price * Config.vars.minProfit);
        //TODO: Determine if we already have a pending bid for this auction
        if (size > Config.vars.minSize) oasis.execute( auction.id, Math.min(size, auction.lot), auction.price );
      });
    });

  }

  async _clipperInit( collateral ) {
    const oasis = new oasisDexAdaptor( collateral.erc20addr );
    const clip = new clipper( collateral.name );

    await oasis.fetch();
    await clip.init();

    setInterval(_this._opportunityCheck(oasis,clip), 60000);

    return({oasis, clip});
  }

  run() {
    config.collateral.forEach( collateral => {
      this._clipperInit(collateral).then( pair => {
        this._clippers = pair;
        console.log('Collateral ' + collateral.name + ' initialized');
      });
      const oasis = new oasisDexAdaptor( collateral.erc20addr );
      const clipper = new clipper( collateral.name );

      this._clippers.push({clipper,oasis});
    });
  }
}
