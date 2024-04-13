import React, { useRef, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Box,
  Button,
  HStack,
  Spacer,
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
        lp_id: "unknown",
        position: position,
      };
    })
    // Make sure reserves1 is not 0
    .filter((position) => {
      return position.willingToBuy > 0;
    })
    .sort((a, b) => {
      // sort by highest price
      return b.price - a.price;
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
    })
    .sort((a, b) => {
      // sort by highest price
      return b.price - a.price;
    });

  console.warn("Buy side", cleaned_buy_side_positions);
  console.warn("Sell side", cleaned_sell_side_positions);

  interface PositionData {
    price: number;
    reserves1: number;
    reserves2: number;
    willingToBuy?: number; // Optional if it only exists on buy positions
    willingToSell?: number; // Optional if it only exists on sell positions
    lp_id: string;
  }

  const DataRow: React.FC<{
    price: number;
    amount: number;
    lpId: string;
    type: string;
    maxAmount: number;
  }> = ({ price, amount, lpId, type, maxAmount }) => (
    <Box position="relative" width="100%">
      <Box
        position="absolute"
        width={`${(amount / maxAmount) * 100}%`} // Calculate width as a percentage of the maxAmount
        height="100%"
        backgroundColor={
          type === "buy" ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 0, 0, 0.3)"
        }
        right="0"
      />
      <HStack
        width="100%"
        justifyContent="space-between"
        fontFamily="monospace"
        fontSize="10px"
        zIndex="1"
        position="relative"
        _hover={{
          backgroundColor: "#4A5568",
          borderRadius: "2px",
          cursor: "pointer",
        }}
        onClick={() => {
          // Redirect to the LP page
          window.open(`/lp/${lpId}`, "_blank", "noopener");
        }}
      >
        <Text color={type === "buy" ? "green.500" : "red.500"}>
          {price.toFixed(6)}
        </Text>
        <Spacer />
        <Text textAlign="right" paddingRight="70px">
          {amount.toFixed(2)}
        </Text>
        <Text>{lpId}</Text>
      </HStack>
    </Box>
  );

  // Ref for scrolling the sell section
  const sellSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sellSectionRef.current) {
      sellSectionRef.current.scrollTop = sellSectionRef.current.scrollHeight;
    }
  }, [sellSidePositions]); // Trigger on sell position changes

  // Finding the maximum amount for scaling the background widths
  const maxBuyAmount = Math.max(
    ...cleaned_buy_side_positions.map((pos) => pos.willingToBuy)
  );
  const maxSellAmount = Math.max(
    ...cleaned_sell_side_positions.map((pos) => pos.willingToSell)
  );
  const maxAmount = Math.max(maxBuyAmount, maxSellAmount);

  return (
    <VStack
      flex={1}
      width="100%"
      justifyContent="stretch"
      spacing={4}
      padding="1em"
      height="600px"
    >
      <HStack
        width="100%"
        fontFamily="monospace"
        fontSize="10px"
        justifyContent="space-between"
      >
        <Text>{`Price (${asset2Token.symbol})`}</Text>
        <Spacer />
        <Text
          paddingRight="80px"
          textAlign={"right"}
        >{`Amount (${asset1Token.symbol})`}</Text>
        <Text>{`LP ID`}</Text>
      </HStack>

      <VStack
        flex={1} // This ensures that the container flexibly fits within its parent, giving equal opportunity for both children to expand
        width="100%"
        height={"50%"}
        spacing={0}
      >
        <VStack
          ref={sellSectionRef}
          flex={1} // Use flex=1 to ensure that this box takes up half the space
          width="100%"
          spacing={1}
          overflowY="auto"
          justifyContent={
            sellSidePositions.length < 15 ? "flex-end" : "flex-start"
          } // Conditionally adjust based on the number of sell rows
        >
          {cleaned_sell_side_positions.map((position, index) => (
            <DataRow
              key={index}
              price={position.price}
              amount={position.willingToSell}
              lpId={position.lp_id}
              type="sell"
              maxAmount={maxAmount}
            />
          ))}
        </VStack>

        {/* Divider between buy and sell sections */}
        <Box width="100%" height="2.5px" backgroundColor="gray.10000" />
        <Box width="100%" height="1px" backgroundColor="gray.200" />
        <Box width="100%" height="2.5px" backgroundColor="gray.10000" />
        <VStack
          flex={1} // Use flex=1 to ensure that this box also takes up half the space
          width="100%"
          spacing={1}
          overflowY="auto"
        >
          {cleaned_buy_side_positions.map((position, index) => (
            <DataRow
              key={index}
              price={position.price}
              amount={position.willingToBuy}
              lpId={position.lp_id}
              type="buy"
              maxAmount={maxAmount}
            />
          ))}
        </VStack>
      </VStack>
    </VStack>
  );
};

export default BuySellChart;
