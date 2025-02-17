'use client';

import { useParams } from 'next/navigation';
import { useBlockSummary } from '../api/block';
import { Card } from '@penumbra-zone/ui/Card';
import { Skeleton } from '@/shared/ui/skeleton';
import { BlockSummary } from './block-summary';

export function InspectBlock() {
  const params = useParams<{ height: string }>();
  const blockheight = params.height;
  // const { data: blockSummary, isLoading, isError } = useBlockSummary(blockheight);
  const isError = false;
  const isLoading = false;
  const blockSummary = {
    rowid: 1,
    height: blockheight,
    time: new Date(),
    batch_swaps: [],
    num_open_lps: 0,
    num_closed_lps: 0,
    num_withdrawn_lps: 0,
    num_swaps: 0,
    num_swap_claims: 0,
    num_txs: 0,
  };

  return (
    <div className='flex flex-col items-center justify-center'>
      <div className='mb-4'>
        {isError ? (
          <Card title={`Couldn’t fetch transaction.`}>
            <div className='w-[840px] min-h-[300px] text-white p-2'>
              Something went wrong while fetching the transaction.
            </div>
          </Card>
        ) : (
          <Card title={`Block #${blockheight}`}>
            <div className='w-[840px] min-h-[300px] text-white p-2'>
              {isLoading ? (
                <div>
                  <div className='w-[822px] h-8 mb-2'>
                    <Skeleton />
                  </div>
                  <div className='w-[722px] h-6 mb-2'>
                    <Skeleton />
                  </div>
                  <div className='w-[422px] h-4'>
                    <Skeleton />
                  </div>
                </div>
              ) : (
                <BlockSummary blockSummary={blockSummary} />
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
