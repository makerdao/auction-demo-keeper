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

set -x

# parameters
ILK_NAME=CRVV1ETHSTETH-A
AMOUNT_TOKENS=25
STECRV=0x06325440D014e39736583c165C2963BA99fAf14E
MCD_JOIN_ETHSTETH_A=0x82D8bfDB61404C796385f251654F6d7e92092b5D
CROPPER=0x8377CD01a5834a6EaD3b7efb482f678f2092b77e
MCD_VAT=0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B
MCD_JUG=0x19c0976f590D67707E62397C87829d896Dc0f1F1
MCD_DOG=0x135954d155898D42C90D2a57824C690e0c7BEf1B

# value conversions
AMOUNT_WEI=$(seth --to-wei $AMOUNT_TOKENS eth)
ILK_BYTES32=$(seth --from-ascii $ILK_NAME | seth --to-bytes32)

echo ""
echo "setting max STECRV allowance for the cropper..."
seth send --gas 500000 $STECRV 'approve(address,uint256)' \
     $CROPPER $(seth --max-uint)

echo ""
echo "joining ${AMOUNT_TOKENS} STECRV into MCD..."
seth send --gas 800000 $CROPPER 'join(address,address,uint256)' \
     $MCD_JOIN_ETHSTETH_A $ETH_FROM $AMOUNT_WEI

# compute maximum art amount

RATE=$(seth call $MCD_VAT "ilks(bytes32)(uint256,uint256,uint256,uint256,uint256)" $ILK_BYTES32 | sed -n 2p)
SPOT=$(seth call $MCD_VAT "ilks(bytes32)(uint256,uint256,uint256,uint256,uint256)" $ILK_BYTES32 | sed -n 3p)
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
echo "locking ${AMOUNT_TOKENS} STECRV for ${MAX_DAI_HUMAN} DAI..."
seth send --gas 3000000 $CROPPER \
     'frob(bytes32,address,address,address,int256,int256)' \
     $ILK_BYTES32 $ETH_FROM $ETH_FROM $ETH_FROM $AMOUNT_WEI $MAX_ART

echo ""
echo "dripping..."
seth send --gas 700000 $MCD_JUG 'drip(bytes32)' $ILK_BYTES32

echo ""
echo "barking..."
URN=$(seth call $CROPPER "proxy(address)(address)" $ETH_FROM)
seth send --gas 2000000 $MCD_DOG 'bark(bytes32,address,address)' $ILK_BYTES32 $URN $ETH_FROM

