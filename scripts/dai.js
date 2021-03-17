import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI, LINK } from '@makerdao/dai-plugin-mcd';

(async () => {
    // console.log('Initiating Maker Service from Dai.js')
    // const maker = await Maker.create('http', {
    //     plugins: [McdPlugin],
    //     url: 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a',
    //     privateKey: '771b81a8691ae7e06142970beda4bb79b896fdd7ddc0d3442423771c32098fb5'
    // });

    // console.log('Current Wallet Address: ', maker.currentAddress());

    // console.log('Ensure there is proxy address');
    // await maker.service('proxy').ensureProxy();
    // console.log('Proxy Address: ', await maker.service('proxy').getProxyAddress());

   let amt = 100.06148718975428571424;
   console.log('DAI ', DAI(amt.toFixed(18)));

   

})();
