import { InfoCard } from '@/pages/explore/ui/info-card';
import { Text } from '@penumbra-zone/ui/Text';
import { BlockSummaryApiResponse } from '@/shared/api/server/block/types';

export function BlockSummary({ blockSummary }: { blockSummary: BlockSummaryApiResponse }) {
  // rowid: number;
  // height: number;
  // time: Date;
  // batch_swaps: BatchSwapSummary[];
  // num_open_lps: number;
  // num_closed_lps: number;
  // num_withdrawn_lps: number;
  // num_swaps: number;
  // num_swap_claims: number;
  // num_txs: number;

  // asset_start: Buffer;
  // asset_end: Buffer;
  // input: string;
  // output: string;
  // num_swaps: number;
  // price_float: number;

  return (
    <div>
      <div className='grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-2 mb-4'>
        <InfoCard title='Total Transactions'>
          <Text large color='text.primary'>
            {blockSummary.num_txs}
          </Text>
        </InfoCard>
        <InfoCard title='Total Swaps'>
          <Text large color='text.primary'>
            {blockSummary.num_swaps}
          </Text>
        </InfoCard>
        <InfoCard title='Total Swap Claims'>
          <Text large color='text.primary'>
            {blockSummary.num_swap_claims}
          </Text>
        </InfoCard>
        <InfoCard title='Total Open LPs'>
          <Text large color='text.primary'>
            {blockSummary.num_open_lps}
          </Text>
        </InfoCard>
        <InfoCard title='Total Closed LPs'>
          <Text large color='text.primary'>
            {blockSummary.num_closed_lps}
          </Text>
        </InfoCard>
        <InfoCard title='Total Withdrawn LPs'>
          <Text large color='text.primary'>
            {blockSummary.num_withdrawn_lps}
          </Text>
        </InfoCard>
      </div>
      <div>
        <Text large color='text.primary'>
          Swaps
        </Text>
        {blockSummary.batch_swaps.map(swap => (
          <div key={swap.asset_start.toString()}>
            <Text large color='text.primary'>
              {swap.asset_start.toString()}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
