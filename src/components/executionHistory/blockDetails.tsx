import { VStack, Text } from '@chakra-ui/react';

export interface BlockDetailsSummary {
  opened: number;
  closed: number;
  withdrawn: number;
  swaps: number;
  arbs: number;
  created: Date;
}
export interface BlockDetailsProps {
  blockSummary: BlockDetailsSummary;
}

export const BlockDetails = ({
  blockSummary: { opened, closed, withdrawn, swaps, arbs },
}: BlockDetailsProps) => {
  return (
    <VStack align='flex-start' spacing={2}>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Positions Opened: '}
        {opened}
      </Text>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Positions Closed: '}
        {closed}
      </Text>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Positions Withdrawn: '}
        {withdrawn}
      </Text>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Swaps: '}
        {swaps}
      </Text>
      <Text fontSize='medium' fontStyle='monospace'>
        {'Arbs: '}
        {arbs}
      </Text>
    </VStack>
  );
};
