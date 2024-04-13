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
  // 1. Clean all data
  console.log("buySidePositions", buySidePositions);
  console.log("sellSidePositions", sellSidePositions);

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
