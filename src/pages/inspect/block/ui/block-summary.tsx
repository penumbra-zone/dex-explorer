import { InfoCard } from '@/pages/explore/ui/info-card';
import { Text } from '@penumbra-zone/ui/Text';
import { Table } from '@penumbra-zone/ui/Table';
import { BlockSummaryApiResponse } from '@/shared/api/server/block/types';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { pnum } from '@penumbra-zone/types/pnum';

export function BlockSummary({ blockSummary }: { blockSummary: BlockSummaryApiResponse }) {
  if ('error' in blockSummary) {
    return <div>Error: {blockSummary.error}</div>;
  }

  return (
    <div>
      <div className='grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-2 mb-8'>
        <InfoCard title='Total Transactions'>
          <Text large color='text.primary'>
            {blockSummary.numTxs}
          </Text>
        </InfoCard>
        <InfoCard title='Total Swaps'>
          <Text large color='text.primary'>
            {blockSummary.numSwaps}
          </Text>
        </InfoCard>
        <InfoCard title='Total Swap Claims'>
          <Text large color='text.primary'>
            {blockSummary.numSwapClaims}
          </Text>
        </InfoCard>
        <InfoCard title='Total Open LPs'>
          <Text large color='text.primary'>
            {blockSummary.numOpenLps}
          </Text>
        </InfoCard>
        <InfoCard title='Total Closed LPs'>
          <Text large color='text.primary'>
            {blockSummary.numClosedLps}
          </Text>
        </InfoCard>
        <InfoCard title='Total Withdrawn LPs'>
          <Text large color='text.primary'>
            {blockSummary.numWithdrawnLps}
          </Text>
        </InfoCard>
      </div>
      <div>
        <div className='mb-4'>
          <Text large color='text.primary'>
            Swaps
          </Text>
        </div>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>From</Table.Th>
              <Table.Th>To</Table.Th>
              <Table.Th>Price</Table.Th>
              <Table.Th>Number of Hops</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {blockSummary.batchSwaps.length ? (
              blockSummary.batchSwaps.map(swap => (
                <Table.Tr key={JSON.stringify(swap)}>
                  <Table.Td>
                    <ValueViewComponent
                      valueView={pnum(swap.startInput).toValueView(swap.startAsset)}
                      trailingZeros={false}
                    />
                  </Table.Td>
                  <Table.Td>
                    <ValueViewComponent
                      valueView={pnum(swap.endOutput).toValueView(swap.endAsset)}
                      trailingZeros={false}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text color='text.primary'>
                      {swap.endPrice} {swap.endAsset.symbol}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text color='text.primary'>{swap.numSwaps}</Text>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td>--</Table.Td>
                <Table.Td>--</Table.Td>
                <Table.Td>--</Table.Td>
                <Table.Td>--</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </div>
    </div>
  );
}
