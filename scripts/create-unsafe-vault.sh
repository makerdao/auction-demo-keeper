#!/usr/bin/env bash

#  Copyright (C) 2020 Maker Ecosystem Growth Holdings, INC.

#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU Affero General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.

#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
#  GNU Affero General Public License for more details.

#  You should have received a copy of the GNU Affero General Public License
#  along with this program.  If not, see <https://www.gnu.org/licenses/>.

# parameters
ILK_NAME=ETH-A
AMOUNT_ETH=1
WETH=0xd0A1E359811322d97991E03f863a0C30C2cF029C
MCD_JOIN_ETH_A=0x775787933e92b709f2a3C70aa87999696e74A9F8
MCD_VAT=0xbA987bDB501d131f766fEe8180Da5d81b34b69d9
MCD_JUG=0xcbB7718c9F39d05aEEDE1c472ca8Bf804b2f1EaD

# value conversions
AMOUNT_WEI=$(seth --to-wei $AMOUNT_ETH eth)
ILK_BYTES32=$(seth --from-ascii $ILK_NAME | seth --to-bytes32)

echo "wrapping ${AMOUNT_ETH} ETH..."
seth send --gas 50000 --value $AMOUNT_WEI $WETH 'deposit()'

echo ""
echo "setting max WETH allowance for the join adapter..."
seth send --gas 50000 $WETH 'approve(address,uint256)' \
     $MCD_JOIN_ETH_A $(seth --max-uint)

echo ""
echo "joining ${AMOUNT_ETH} WETH into MCD..."
seth send --gas 80000 $MCD_JOIN_ETH_A 'join(address,uint256)' \
     $ETH_FROM $AMOUNT_WEI

# compute maximum art amount
RATE=$(seth call $MCD_VAT "ilks(bytes32)(uint256,uint256,uint256,uint256,uint256)" $ETH_ILK | sed -n 2p)
SPOT=$(seth call $MCD_VAT "ilks(bytes32)(uint256,uint256,uint256,uint256,uint256)" $ETH_ILK | sed -n 3p)
echo "RATE $RATE"
echo "SPOT $SPOT"
MAX_DAI=$(echo "$SPOT * $AMOUNT_WEI" | bc)
MAX_ART=$(echo "$MAX_DAI / $RATE" | bc)
MAX_DAI_HUMAN=$(echo "$MAX_DAI / 10 ^ 45" | bc)
echo "MAX_DAI $MAX_DAI"
echo "MAX_ART $MAX_ART"
echo "MAX_DAI_HUMAN $MAX_DAI_HUMAN"
echo "AMOUNT_WEI $AMOUNT_WEI"

echo ""
echo "locking ${AMOUNT_ETH} WETH for ${MAX_DAI_HUMAN} DAI..."
seth send --gas 130000 $MCD_VAT \
     'frob(bytes32,address,address,address,int256,int256)' \
     $ILK_BYTES32 $ETH_FROM $ETH_FROM $ETH_FROM $AMOUNT_WEI $MAX_ART

echo ""
echo "dripping..."
seth send --gas 70000 $MCD_JUG 'drip(bytes32)' $ILK_BYTES32
