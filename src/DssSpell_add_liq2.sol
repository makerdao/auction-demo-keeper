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

import "lib/dss-interfaces/src/dapp/DSPauseAbstract.sol";
import "lib/dss-interfaces/src/dss/CatAbstract.sol";
import "lib/dss-interfaces/src/dss/EndAbstract.sol";
import "lib/dss-interfaces/src/dss/FlipAbstract.sol";
import "lib/dss-interfaces/src/dss/VatAbstract.sol";
import "lib/dss-interfaces/src/dss/VowAbstract.sol";

interface DogAbstract {
    function wards(address) external view returns (uint256);
    function rely(address) external;
    function deny(address) external;
    function Dirt() external view returns (uint256);
    function Hole() external view returns (uint256);
    function ilks(bytes32) external view returns (address, uint256, uint256, uint256, uint256, uint256);
    function live() external view returns (uint256);
    function vat() external view returns (address);
    function vow() external view returns (address);
    function file(bytes32, address) external;
    function file(bytes32, uint256) external;
    function file(bytes32, bytes32, uint256) external;
    function file(bytes32, bytes32, address) external;
    function chop(bytes32) external view returns (uint256);
    function bark(bytes32, address) external returns (uint256);
    function digs(bytes32, uint256) external;
    function cage() external;
}

interface ClipAbstract {
  function dog() external view returns (address);
  function vat() external view returns (address);
  function vow() external view returns (address);
  function wards(address) external view returns (uint256);
  function rely(address) external;
  function deny(address) external;
  function file(bytes32, address) external;
  function file(bytes32, uint256) external;
}

interface AbacusAbstract {
    function file(bytes32, uint256) external;
}

contract SpellAction {

    // Testnet addresses
    //
    // The contracts in this list should correspond to MCD on testchain, which can be verified at
    // https://github.com/makerdao/testchain/blob/a293003c3a68474b12e303f54de6e455cefee82c/out/addresses-mcd.json

    address constant MCD_VAT             = 0xb002A319887185e56d787A5c90900e13834a85E3;
    address constant MCD_VOW             = 0x32fE44E2061A19419C0F112596B6f6ea77EC6511;
    address constant MCD_FLIP_ETH_A      = 0xc1F5856c066cfdD59D405DfCf1e77F667537bc99;
    address public MCD_DOG;
    address public MCD_CLIP_ETH_A;
    address public MCD_ABACUS_ETH_A;

    // Decimals & precision
    uint256 constant THOUSAND = 10 ** 3;
    uint256 constant MILLION  = 10 ** 6;
    uint256 constant WAD      = 10 ** 18;
    uint256 constant RAY      = 10 ** 27;
    uint256 constant RAD      = 10 ** 45;

    constructor(address dog, address clipper, address abacus) public {
        MCD_DOG = dog;
        MCD_CLIP_ETH_A = clipper;
        MCD_ABACUS_ETH_A = abacus;
    }

    function execute() external {

        // ************************
        // *** Liquidations 2.0 ***
        // *** Initial parameters used from https://github.com/makerdao/dss/blob/liq-2.0/src/test/clip.t.sol ***
        // ************************

        require(CatAbstract(MCD_CAT_OLD).vat() == MCD_VAT,          "non-matching-vat");
        require(CatAbstract(MCD_CAT_OLD).vow() == MCD_VOW,          "non-matching-vow");

        require(CatAbstract(MCD_DOG).vat() == MCD_VAT,              "non-matching-vat");
        require(CatAbstract(MCD_DOG).live() == 1,                   "dog-not-live");

        /// DOG
        DogAbstract(MCD_DOG).file("vow", MCD_VOW);
        VatAbstract(MCD_VAT).rely(MCD_DOG);
        VowAbstract(MCD_VOW).rely(MCD_DOG);

        DogAbstract(MCD_DOG).file("Hole", 1000 * RAD);

        /// ABACUS
        AbacusAbstract(MCD_ABACUS_ETH_A).file("cut",  0.01 * RAY);   // 1% decrease
        AbacusAbstract(MCD_ABACUS_ETH_A).file("step", 1);            // Decrease every 1 second

        // CLIP
        VatAbstract(MCD_VAT).rely(MCD_CLIP_ETH_A)                // Is this needed?
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
        DogAbstract(MCD_DOG).file(ilk, "hole", 1000 * RAD); // 30 MM DAI
        DogAbstract(MCD_DOG).file(ilk, "chip", 0.02 * WAD); // linear increase of 2% of tab
        DogAbstract(MCD_DOG).file(ilk, "tip", 2 * RAD); // flat fee of two DAI

        DogAbstract(MCD_DOG).rely(address(newClip));

        newClip.rely(MCD_DOG);
        newClip.rely(MCD_END);

        newClip.file("buf",  1.25 * RAY);   // 25% Initial price buffer
        newClip.file("calc", address(MCD_ABACUS_ETH_A));  // File price contract
        newClip.file("cusp", 0.3 * RAY);                  // 70% drop before reset
        newClip.file("tail", 3600);         // 1 hour before reset
    }
}

contract DssSpell {
    DSPauseAbstract public pause =
        DSPauseAbstract(0xd34835EaE60dA418abfc538B7b55332fC5F10340);
    address         public action;
    bytes32         public tag;
    uint256         public eta;
    bytes           public sig;
    uint256         public expiration;
    bool            public done;

    // Provides a descriptive tag for bot consumption
    string constant public description =
        "Auction-Demo-Keeper LIQ2.0 Support";

    constructor(address dog, address clipper, address abacus) public {
        sig = abi.encodeWithSignature("execute()");
        action = address(new SpellAction(dog, clipper, abacus));
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

    function cast() public /* officeHours */ {
        require(!done, "spell-already-cast");
        done = true;
        pause.exec(action, tag, sig, eta);
    }
}
