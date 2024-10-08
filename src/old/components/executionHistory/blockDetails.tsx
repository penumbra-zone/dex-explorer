// @ts-nocheck
/* eslint-disable -- disabling this file as this was created before our strict rules */
import { BlockSummaryData } from '@/old/utils/types/block';
import { VStack, Text } from '@chakra-ui/react';

export interface BlockDetailsProps {
  blockSummary: BlockSummaryData;
}

export const BlockDetails = ({ blockSummary }: BlockDetailsProps) => {
  return (
    <VStack align='flex-start' spacing={2}>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Positions Opened: '}
        {blockSummary.openPositionEvents.length}
      </Text>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Positions Closed: '}
        {blockSummary.closePositionEvents.length}
      </Text>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Positions Withdrawn: '}
        {blockSummary.withdrawPositionEvents.length}
      </Text>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Swaps: '}
        {blockSummary.swapExecutions.length}
      </Text>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Arbs: '}
        {blockSummary.arbExecutions.length}
      </Text>
    </VStack>
  );
};
