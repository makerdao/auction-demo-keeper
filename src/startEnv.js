import Keeper from './keeper.js';

const keeper = new Keeper(process.env.AUCTION_DEMO_KEEPER_CONFIG,
    process.env.AUCTION_DEMO_KEEPER_PASSWORD_PATH, process.env.AUCTION_DEMO_KEEPER_KEYSTORE_PATH);
console.log('\nInitializing Keeper\n');
keeper.run();