import React from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { LiquidityPositionEvent } from "@/utils/indexer/types/lps";
import ClosedPositionStatus from "@/components/liquidityPositions/closedStatus";
import OpenPositionStatus from "@/components/liquidityPositions/openStatus";
import WithdrawnPositionStatus from "@/components/liquidityPositions/withdrawnStatus";
import BlockTimestampView from "../blockTimestamp";

interface TimelinePositionProps {
  nftId: string;
  lp_event: LiquidityPositionEvent;
}

export const POSITION_OPEN_EVENT = "EventPositionOpen";
export const POSITION_CLOSE_EVENT = "EventQueuePositionClose";
export const POSITION_WITHDRAW_EVENT = "EventPositionWithdraw";

const TimelinePosition = ({ nftId, lp_event }: TimelinePositionProps) => {
  //console.log(lp_event);
  return (
    <>
      <HStack
        spacing={{ base: "1em", md: "2em" }}
        alignItems={{ base: "flex-start", md: "center" }}
        flexDirection={{ base: "column", md: "row" }}
      >
        <Box
          className="neon-box"
          width={{ base: "100%", md: "28em" }}
          height={"fit-content"}
          padding="2em"
        >
          {lp_event.type.includes(POSITION_OPEN_EVENT) ? (
            <OpenPositionStatus nftId={nftId} lp_event={lp_event} />
          ) : lp_event.type.includes(POSITION_CLOSE_EVENT) ? (
            <ClosedPositionStatus nftId={nftId} lp_event={lp_event} />
          ) : (
            <WithdrawnPositionStatus nftId={nftId} lp_event={lp_event} />
          )}
        </Box>
        <VStack spacing={".5em"} align={"flex-end"}>
          <BlockTimestampView blockHeight={lp_event.block_height} timestamp={lp_event.created_at} />
        </VStack>
      </HStack>
    </>
  );
};

export default TimelinePosition;
