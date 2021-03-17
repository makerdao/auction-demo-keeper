import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI, LINK } from '@makerdao/dai-plugin-mcd';

(async () => {
    console.log('Initiating Maker Service from Dai.js')
    const maker = await Maker.create('http', {
        plugins: [McdPlugin],
        url: 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a',
        privateKey: ''
    });

    console.log('Current Wallet Address: ', maker.currentAddress());

    console.log('Ensure there is proxy address');
    await maker.service('proxy').ensureProxy();
    console.log('Proxy Address: ', await maker.service('proxy').getProxyAddress());

    //create risky vault using ETH-A 
    console.log(' ');
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

    console.log(' ');
    console.log('Dripping LINK-A JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip('0x4c494e4b2d410000000000000000000000000000000000000000000000000000');


    // Refreshing vault data
    vault.reset();
    await vault.prefetch();

    // Reading Vault Information
    let managedVault = await manager.getCdp(vaultId);
    managedVault.reset();
    await managedVault.prefetch();
    const vaultUrnAddr = await manager.getUrn(vaultId);
    console.log('Vault: Urn Address', vaultUrnAddr);

    const amtDai = await managedVault.daiAvailable._amount;

    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('DAI Available to Generate', managedVault.daiAvailable._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);

    console.log(' ');
    console.log(`Drawing ${DAI(amtDai.toFixed(17))} from Vault #${vaultId}`);

    try{
        let drawDai = await manager.draw(
            vaultId,
            'LINK-A',
            DAI(amtDai.toFixed(17))
        );
        drawDai;
    }catch(error){
        console.error(error);
    }

    console.log(' ');
    console.log('Dripping LINK-A JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip('0x4c494e4b2d410000000000000000000000000000000000000000000000000000');

        
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


    process.kill(process.pid, 'SIGTERM');
})();
