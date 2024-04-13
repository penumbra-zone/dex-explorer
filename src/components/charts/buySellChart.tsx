import React, { useRef, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Box,
  Button,
  HStack,
  Text,
  useBreakpoint,
  VStack,
} from "@chakra-ui/react";
import { Token } from "@/constants/tokenConstants";
import { Position } from "@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/dex/v1/dex_pb";
import { fromBaseUnit } from "@/utils/math/hiLo";
import BigNumber from "bignumber.js";

interface BuySellprops {
  buySidePositions: Position[];
  sellSidePositions: Position[];
  asset1Token: Token;
  asset2Token: Token;
}

const BuySellChart = ({
  buySidePositions,
  sellSidePositions,
  asset1Token,
  asset2Token,
}: BuySellprops) => {
  const cleaned_buy_side_positions = buySidePositions
    .filter(
      (position) =>
        position.state?.state.toLocaleString() === "POSITION_STATE_ENUM_OPENED"
    )
    .map((position) => {
      const reserves1 = fromBaseUnit(
        BigInt(position.reserves!.r1!.lo ?? 0),
        BigInt(position.reserves!.r1!.hi ?? 0),
        asset1Token.decimals
      );
      const reserves2 = fromBaseUnit(
        BigInt(position.reserves!.r2!.lo ?? 0),
        BigInt(position.reserves!.r2!.hi ?? 0),
        asset2Token.decimals
      );

      const p: BigNumber = fromBaseUnit(
        BigInt(position!.phi!.component!.p!.lo || 0),
        BigInt(position!.phi!.component!.p!.hi || 0),
        asset2Token.decimals
      );
      const q: BigNumber = fromBaseUnit(
        BigInt(position!.phi!.component!.q!.lo || 0),
        BigInt(position!.phi!.component!.q!.hi || 0),
        asset1Token.decimals
      );

      let price = Number.parseFloat(q.div(p).toFixed(6));

      const willingToBuy = Number.parseFloat(reserves1.toFixed(6));

      return {
        price: price,
        reserves1: Number.parseFloat(reserves1.toFixed(6)),
        reserves2: Number.parseFloat(reserves2.toFixed(6)),
        willingToBuy: willingToBuy,
        lp_id: "unkown",
        position: position,
      };
    })
    // Make sure reserves1 is not 0
    .filter((position) => {
      return position.willingToBuy > 0;
    });

  const cleaned_sell_side_positions = sellSidePositions
    .filter(
      (position) =>
        position.state?.state.toLocaleString() === "POSITION_STATE_ENUM_OPENED"
    )
    .map((position) => {
      const reserves1 = fromBaseUnit(
        BigInt(position.reserves!.r1!.lo ?? 0),
        BigInt(position.reserves!.r1!.hi ?? 0),
        asset1Token.decimals
      );
      const reserves2 = fromBaseUnit(
        BigInt(position.reserves!.r2!.lo ?? 0),
        BigInt(position.reserves!.r2!.hi ?? 0),
        asset2Token.decimals
      );

      const p: BigNumber = fromBaseUnit(
        BigInt(position!.phi!.component!.p!.lo || 0),
        BigInt(position!.phi!.component!.p!.hi || 0),
        asset2Token.decimals
      );
      const q: BigNumber = fromBaseUnit(
        BigInt(position!.phi!.component!.q!.lo || 0),
        BigInt(position!.phi!.component!.q!.hi || 0),
        asset1Token.decimals
      );

      let price = Number.parseFloat(q.div(p).toFixed(6));

      const willingToSell = Number.parseFloat(reserves2.toFixed(6)) * price;
      return {
        price: price,
        reserves1: Number.parseFloat(reserves1.toFixed(6)),
        reserves2: Number.parseFloat(reserves2.toFixed(6)),
        willingToSell: willingToSell,
        lp_id: "unknown",
        position: position,
      };
    })
    // Make sure willingToSell is not 0
    .filter((position) => {
      return position.willingToSell > 0;
    });

  console.warn("Buy side", cleaned_buy_side_positions);
  console.warn("Sell side", cleaned_sell_side_positions);

  return (
    <VStack
      flex={1}
      width="100%"
      height="100%" // This ensures the VStack takes the full height of its parent
      justifyContent="stretch" // This will stretch the children to fill the container
      spacing={0} // Remove any spacing between VStack children
    >
      <Text fontFamily={"monospace"} fontSize="xs" padding={"1em"}>
        Direct Liq Order Book
      </Text>
      <VStack
        flex={1} // This allows the VStack to grow and fill the available space
        width="100%"
        height="100%" // Ensure the VStack takes full height of its container
        spacing={2} // Adds space between children; adjust as needed
        overflowY="auto" // Adds scrollability to the VStack for overflow content
      >
        <HStack width="100%" justify="space-between"></HStack>

        <VStack flex={1} width="100%" spacing={2}>
          <Text flex={1} textAlign="left" overflowX="auto">
            Col1
          </Text>
          <HStack flex={1} width="100%" spacing={2} padding="10px">
            <Text>Price</Text>
          </HStack>
          <Text flex={1} textAlign="right" overflowX="auto">
            Col2
          </Text>
        </VStack>
      </VStack>
    </VStack>
  );
};

export default BuySellChart;
