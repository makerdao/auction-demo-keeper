import { ethers } from 'ethers';
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

const ts = (await provider.getBlock("latest")).timestamp + 45 * 60
await provider.send('evm_setNextBlockTimestamp', [parseFloat(ts.toString())]);