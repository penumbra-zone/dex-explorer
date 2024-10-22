'use client';

import { PairSelector } from '@/components/PairSelector';
import { Chart } from '@/components/chart';
import { RouteBook } from '@/components/route-book';
import { Card } from '@penumbra-zone/ui/Card';
import { useAssets } from '@/shared/state/assets.ts';
import { useMemo } from 'react';

interface QueryParams {
  primary: string;
  numeraire: string;
}

// Converts symbol to Metadata
const usePathToMetadata = (params: QueryParams) => {
  const { data, error, isLoading } = useAssets();
  return useMemo(
    () => ({
      primary: data?.find(a => a.symbol === params.primary),
      numeraire: data?.find(a => a.symbol === params.numeraire),
      error,
      isLoading,
    }),
    [data, error, isLoading, params.numeraire, params.primary],
  );
};

export default function TradePage({ params }: { params: QueryParams }) {
  const { primary, numeraire, error, isLoading } = usePathToMetadata(params);

  return (
    <div>
      <div className='flex gap-2'>
        {!!error && `Error loading pair selector: ${String(error)}`}
        {isLoading && 'Loading...'}
        {primary && numeraire && <PairSelector primary={primary} numeraire={numeraire} />}
      </div>

      <div className='flex flex-wrap lg:gap-2'>
        <div className='w-full lg:w-auto lg:flex-grow mb-2'>
          <Card title='Chart'>
            <Chart height={512} />
          </Card>
        </div>
        <div className='w-full sm:w-1/2 sm:pr-1 lg:w-[336px] lg:pr-0 mb-2'>
          <Card title='Route Book'>
            <RouteBook />
          </Card>
        </div>
        <div className='w-full sm:w-1/2 sm:pl-1 lg:w-[304px] lg:pl-0 mb-2'>
          <Card title='Order Form'>
            <div className='h-[512px]'>-</div>
          </Card>
        </div>
      </div>
      <div className='flex flex-wrap lg:gap-2'>
        <div className='w-full lg:w-auto lg:flex-grow mb-2'>
          <Card title='Positions'>
            <div className='h-[256px]'>-</div>
          </Card>
        </div>
        <div className='w-full sm:w-1/2 sm:pr-1 lg:w-[336px] lg:pr-0 mb-2'>
          <Card title='Market Trades'>
            <div className='h-[256px]'>-</div>
          </Card>
        </div>
        <div className='w-full sm:w-1/2 sm:pl-1 lg:w-[304px] lg:pl-0 mb-2'>
          <Card title='Assets'>
            <div className='h-[256px]'>-</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
