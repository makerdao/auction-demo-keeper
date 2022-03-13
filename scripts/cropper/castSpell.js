import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

const privateKey = "0xXXX";
let wallet = new ethers.Wallet(privateKey)
let walletSigner = wallet.connect(provider)

const spellAddr = "0xEEC1e1aef39309998d14615a177d989F37342cf1"
const spellAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"action","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"cast","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"done","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"eta","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"expiration","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"log","outputs":[{"internalType":"contract Changelog","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextCastTime","outputs":[{"internalType":"uint256","name":"castTime","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"officeHours","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[{"internalType":"contract PauseAbstract","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"schedule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"sig","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tag","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"}]
const dssSpell = new ethers.Contract(spellAddr, spellAbi, walletSigner);

const megapokerAddr = "0x70098F537EE8D0E00882585b7B02C45cd6AB3186"
const megapokerAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ilkCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"ilks","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"osmCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"osms","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"poke","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"refresh","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"registry","outputs":[{"internalType":"contract IlkReg","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"spot","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
const megapoker = new ethers.Contract(megapokerAddr, megapokerAbi, walletSigner);

const castSpell = async () => {

    // is spell executed
    const done = await dssSpell.done();
    if (done) return;

    // get execution timestamp
    const castTime = await dssSpell.nextCastTime();
    await provider.send('evm_setNextBlockTimestamp', [parseFloat(castTime.toString())]);

    // cast spell
    await dssSpell.cast({ gasLimit: 3_000_000 });
};

const pokeMegapoker = async () => {
    await megapoker.poke({ gasLimit: 3_000_000 });

    let timestamp = (await provider.getBlock("latest")).timestamp + 60 * 60 * 2
    await provider.send('evm_setNextBlockTimestamp', [parseFloat(timestamp.toString())]);

    await megapoker.poke({ gasLimit: 3_000_000 });
};

const all = async () => {
    await castSpell()
    await pokeMegapoker()
};

all()

