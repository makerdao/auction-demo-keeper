import Keeper from './keeper.js';
const keeper = new Keeper('https://kovan.infura.io/v3/c7c45c0e046e49feb141d72680af4f0a', 'kovan');
console.log('Keeper', keeper);
keeper.run();