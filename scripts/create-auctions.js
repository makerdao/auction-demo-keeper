import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI, LINK } from '@makerdao/dai-plugin-mcd';

let maker;
let linkBalance;
const ilk = '0x4c494e4b2d410000000000000000000000000000000000000000000000000000';
let urns = [];

(async () => {
    console.log('Initiating Maker Service from Dai.js')
    maker = await Maker.create('http', {
        plugins: [McdPlugin],
        url: 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a',
        privateKey: ''
    });

    const address = maker.currentAddress();
    linkBalance = await maker.getToken(LINK).balance();
    console.log('Current Wallet Address: ', address);
    console.log('Link balance ', linkBalance._amount);

    if (Number(linkBalance._amount) < 16.49) throw 'NOT ENOUGHT LINK-A BALANCE';

    console.log('Ensure there is proxy address');
    await maker.service('proxy').ensureProxy();
    console.log('Proxy Address: ', await maker.service('proxy').getProxyAddress());

    while (Number(linkBalance._amount) > 16.49) {
        await createVaults();
    }

    //Barking on all urns
    console.log(' ');
    console.log('Risky Urns');
    urns.forEach(urn => {
        console.log(urn);
        //dog.bark(ilk, urn, kpr)
    });

    process.kill(process.pid, 'SIGTERM');
})();

const createVaults = async () => {
    //create risky vault using ETH-A 
    console.log(' ');
    console.log('--------------------------------------------------------------------');
    console.log('Creating risky vault');
    const manager = maker.service('mcd:cdpManager');

    const vault = await manager.open('LINK-A');
    let vaultId = vault.id;
    console.log('Vault ID', vaultId);

    console.log('Locking 16.49 LINK-A');
    await manager.lock(
        vault.id,
        'LINK-A',
        LINK(16.49)
    );

    linkBalance = await maker.getToken(LINK).balance();

    console.log(' ');
    console.log('Dripping LINK-A JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip(ilk);


    // Refreshing vault data
    vault.reset();
    await vault.prefetch();

    // Reading Vault Information
    let managedVault = await manager.getCdp(vaultId);
    managedVault.reset();
    await managedVault.prefetch();
    const vaultUrnAddr = await manager.getUrn(vaultId);
    console.log('Vault: Urn Address', vaultUrnAddr);
    urns.push(vaultUrnAddr);

    const amtDai = await managedVault.daiAvailable._amount;

    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('DAI Available to Generate', managedVault.daiAvailable._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);

    console.log(' ');
    console.log(`Drawing ${DAI(amtDai.toFixed(17))} from Vault #${vaultId}`);

    try {
        let drawDai = await manager.draw(
            vaultId,
            'LINK-A',
            DAI(amtDai.toFixed(17))
        );
        drawDai;
    } catch (error) {
        console.error(error);
    }

    console.log(' ');
    console.log('Dripping LINK-A JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip(ilk);


    //Refreshing Vault Data
    managedVault.reset();
    await managedVault.prefetch();

    // Getting Updated state from Vault
    console.log(' ');
    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('DAI Available to Generate', managedVault.daiAvailable._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);
};