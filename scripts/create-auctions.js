import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI, LINK } from '@makerdao/dai-plugin-mcd';

(async () => {
    console.log('Initiating Maker Service from Dai.js')
    const maker = await Maker.create('http', {
        plugins: [McdPlugin],
        url: 'https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a',
        privateKey: 'INSERT_PRIVATE_EKY'
    });

    console.log('Current Wallet Address: ',maker.currentAddress());

    console.log('Ensure there is proxy address');
    await maker.service('proxy').ensureProxy();
    console.log('Proxy Address: ', await maker.service('proxy').getProxyAddress());

    //create risky vault using ETH-A 
    console.log('Creating risky vault');
    const manager = maker.service('mcd:cdpManager');
    let vault = null;
    try{
        vault = await manager.openLockAndDraw(
            'LINK-A',
            LINK(16.49),
            DAI(100.06)
        );
        vault;
    }catch(error) {
        console.log(error);
    }

    // Reading Vault Information
    const vaultId = vault.id;
    const vaultUrnAddr = await manager.getUrn(vaultId);
    console.log('Vault: Urn Address', vaultUrnAddr);

    const managedVault = await manager.getCdp(vaultId);
    console.log('Managed Vault: ', managedVault);

    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);

    console.log(' ');
    console.log('Dripping JUG');
    await maker
        .service('smartContract')
        .getContract('MCD_JUG')
        .drip('0x4c494e4b2d410000000000000000000000000000000000000000000000000000');
    
    

    console.log('Collateral Value: ', managedVault.collateralValue._amount);
    console.log('Debt Value: ', managedVault.debtValue._amount);
    console.log('Collateralization Ratio ', managedVault.collateralizationRatio._amount);
    console.log('Liquidation Price ', managedVault.liquidationPrice._amount);
    console.log('Is Vault safe? ', managedVault.isSafe);
    

    process.kill(process.pid, 'SIGTERM');
})();
