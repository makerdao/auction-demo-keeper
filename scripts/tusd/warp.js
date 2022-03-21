import { ethers } from 'ethers';
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

const ts = (await provider.getBlock("latest")).timestamp + 320000 // 432,000 is the full time
await provider.send('evm_setNextBlockTimestamp', [parseFloat(ts.toString())]);