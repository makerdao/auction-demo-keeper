// Copyright (C) 2020 Maker Ecosystem Growth Holdings, INC.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

pragma solidity 0.5.12;

import "../lib/dss-interfaces/src/dapp/DSPauseAbstract.sol";

import "../lib/dss-interfaces/src/dss/CatAbstract.sol";
import "../lib/dss-interfaces/src/dss/EndAbstract.sol";
import "../lib/dss-interfaces/src/dss/FlipAbstract.sol";
import "../lib/dss-interfaces/src/dss/FlipperMomAbstract.sol";
import "../lib/dss-interfaces/src/dss/OsmAbstract.sol";
import "../lib/dss-interfaces/src/dss/VatAbstract.sol";
import "../lib/dss-interfaces/src/dss/VowAbstract.sol";

// TODO add Dog and Clip Abstract 

interface DogAbstract {
    function wards(address) external view returns (uint256);
    function rely(address) external;
    function deny(address) external;
    function box() external view returns (uint256);
    function litter() external view returns (uint256);
    function ilks(bytes32) external view returns (address, uint256, uint256);
    function live() external view returns (uint256);
    function vat() external view returns (address);
    function vow() external view returns (address);
    function file(bytes32, address) external;
    function file(bytes32, uint256) external;
    function file(bytes32, bytes32, uint256) external;
    function file(bytes32, bytes32, address) external;
    function bite(bytes32, address) external returns (uint256);
    function claw(uint256) external;
    function cage() external;
}

contract SpellAction {

    // Testnet addresses
    //
    // The contracts in this list should correspond to MCD on testchain, which can be verified at
    // https://github.com/makerdao/testchain/blob/a293003c3a68474b12e303f54de6e455cefee82c/out/addresses-mcd.json

    address constant MCD_VAT             = 0xCe1410e4b98058fA7534FA8fcEe28E82056EB0e9;
    address constant MCD_VOW             = 0xb002A319887185e56d787A5c90900e13834a85E3;
    address constant MCD_FLIP_ETH_A      = 0xd6D7C74729bB83c35138E54b8d5530ea96920c92;
    address public MCD_CLIP_ETH_A;
    address public MCD_DOG;

    // Decimals & precision
    uint256 constant THOUSAND = 10 ** 3;
    uint256 constant MILLION  = 10 ** 6;
    uint256 constant WAD      = 10 ** 18;
    uint256 constant RAY      = 10 ** 27;
    uint256 constant RAD      = 10 ** 45;

    constructor(address dog, address clipper) public {
        MCD_DOG = dog;
        MCD_CLIP = clipper;
    }

    function execute() external {

        // ************************
        // *** Liquidations 2.0 ***
        // ************************

        require(CatAbstract(MCD_CAT_OLD).vat() == MCD_VAT,          "non-matching-vat");
        require(CatAbstract(MCD_CAT_OLD).vow() == MCD_VOW,          "non-matching-vow");

        require(CatAbstract(MCD_DOG).vat() == MCD_VAT,              "non-matching-vat");
        require(CatAbstract(MCD_DOG).live() == 1,                   "dog-not-live");

        /// DOG

        DogAbstract(MCD_DOG).file("vow", MCD_VOW);
        VatAbstract(MCD_VAT).rely(MCD_DOG);
        VowAbstract(MCD_VOW).rely(MCD_DOG);

        VatAbstract(MCD_VAT).rely(MCD_CLIP_ETH_A) // Is this needed?

        DogAbstract(MCD_DOG).file("Hole", 30 * MILLION * RAD);

        /// CLIP
        /* StairstepExponentialDecrease calc = new StairstepExponentialDecrease();
        calc.file("cut",  ray(0.01 ether));   // 1% decrease
        calc.file("step", 1);                 // Decrease every 1 second

        clip.file("buf",  ray(1.25 ether));   // 25% Initial price buffer
        clip.file("calc", address(calc));     // File price contract
        clip.file("cusp", ray(0.3 ether));    // 70% drop before reset
        clip.file("tail", 3600);              // 1 hour before reset */


        _flipToClip(ClipAbstract(MCD_CLIP_ETH_A), FlipAbstract(MCD_FLIP_ETH_A));


    }

    function _flipToClip(ClipAbstract newClip, FlipAbstract oldFlip) internal {
        bytes32 ilk = newClip.ilk();
        require(ilk == oldFlip.ilk(), "non-matching-ilk");
        require(newClip.vat() == oldFlip.vat(), "non-matching-vat");
        require(newClip.dog() == MCD_DOG, "non-matching-cat");
        require(newClip.vat() == MCD_VAT, "non-matching-vat");

        DogAbstract(MCD_DOG).file(ilk, "clip", address(newClip));
        DogAbstract(MCD_DOG).file(ilk, "chop", 1.1 ether); // 10% chop
        DogAbstract(MCD_DOG).file(ilk, "hole", 30 * MILLION * RAD); // 30 MM DAI
        DogAbstract(MCD_DOG).file(ilk, "chip", 0.02 * WAD); // linear increase of 2% of tab
        DogAbstract(MCD_DOG).file(ilk, "tip", 2 * RAD); // flat fee of two DAI

        DogAbstract(MCD_DOG).rely(address(newClip));

        newClip.rely(MCD_DOG);
        newClip.rely(MCD_END);


        newClip.file("beg", oldFlip.beg());
        newClip.file("ttl", oldFlip.ttl());
        newClip.file("tau", oldFlip.tau());
    }
}

contract DssSpell {
    DSPauseAbstract public pause =
        DSPauseAbstract(0xbE286431454714F511008713973d3B053A2d38f3);
    address         public action;
    bytes32         public tag;
    uint256         public eta;
    bytes           public sig;
    uint256         public expiration;
    bool            public done;

    // Provides a descriptive tag for bot consumption
    // This should be modified weekly to provide a summary of the actions
    // Hash: seth keccak -- "$(wget https://raw.githubusercontent.com/makerdao/community/6304d5d461f6a0811699eb04fa48b95d68515d8f/governance/votes/Executive%20vote%20-%20August%2028%2C%202020.md -q -O - 2>/dev/null)"
    string constant public description =
        "2020-08-28 MakerDAO Executive Spell | Hash: 0x67885f84f0d31dc816fc327d9912bae6f207199d299543d95baff20cf6305963";

    constructor(address dog, address clipper) public {
        sig = abi.encodeWithSignature("execute()");
        action = address(new SpellAction(dog, clipper));
        bytes32 _tag;
        address _action = action;
        assembly { _tag := extcodehash(_action) }
        tag = _tag;
        expiration = now + 30 days;
    }

    modifier officeHours {
        uint day = (now / 1 days + 3) % 7;
        require(day < 5, "Can only be cast on a weekday");
        uint hour = now / 1 hours % 24;
        require(hour >= 14 && hour < 21, "Outside office hours");
        _;
    }

    function schedule() public {
        require(now <= expiration, "This contract has expired");
        require(eta == 0, "This spell has already been scheduled");
        eta = now + DSPauseAbstract(pause).delay();
        pause.plot(action, tag, sig, eta);
    }

    function cast() public officeHours {
        require(!done, "spell-already-cast");
        done = true;
        pause.exec(action, tag, sig, eta);
    }
}
