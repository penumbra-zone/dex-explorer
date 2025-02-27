'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useState } from 'react';
import cn from 'clsx';
import { Text } from '@penumbra-zone/ui/Text';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import { SegmentedControl } from '@penumbra-zone/ui/SegmentedControl';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import Link from 'next/link';
import { SquareArrowOutUpRight } from 'lucide-react';
import {
  AssetSelector,
  AssetSelectorValue,
  isBalancesResponse,
} from '@penumbra-zone/ui/AssetSelector';
import { useAssets } from '@/shared/api/assets';
import { useBalances } from '@/shared/api/balances';
import { getMetadataFromBalancesResponse } from '@penumbra-zone/getters/balances-response';
import { useLeaderboard } from '@/pages/leaderboard/api/use-leaderboard';
import { DEFAULT_INTERVAL, LeaderboardIntervalFilter } from '../api/utils';
import { serialize } from '@/shared/utils/serializer';
import { uint8ArrayToHex } from '@penumbra-zone/types/hex';

export const LeaderboardTable = () => {
  const [parent] = useAutoAnimate();

  const [interval, setInterval] = useState(DEFAULT_INTERVAL);
  const [base, setBase] = useState<AssetSelectorValue>();
  console.log('TCL: LeaderboardTable -> base', base);
  const [quote, setQuote] = useState<AssetSelectorValue>();
  console.log('TCL: LeaderboardTable -> quote', quote);

  const baseAssetId =
    base &&
    uint8ArrayToHex(
      (isBalancesResponse(base) ? getMetadataFromBalancesResponse(base) : base).penumbraAssetId
        .inner,
    );
  console.log('TCL: LeaderboardTable -> baseAssetId', baseAssetId);
  const quoteAssetId =
    quote &&
    uint8ArrayToHex(
      (isBalancesResponse(quote) ? getMetadataFromBalancesResponse(quote) : quote).penumbraAssetId
        .inner,
    );

  const {
    data: leaderboard,
    error,
    isLoading,
  } = useLeaderboard({
    interval,
    base: baseAssetId,
    quote: quoteAssetId,
  });

  const { data: assets } = useAssets();
  const { data: balances } = useBalances();

  if (error) {
    return (
      <Text large color='destructive.light'>
        {error.message}
      </Text>
    );
  }

  const { data: positions } = leaderboard ?? {};

  return (
    <>
      <div className='flex gap-4 justify-between items-center text-text-primary'>
        <Text large whitespace='nowrap'>
          Leaderboard
        </Text>

        <div className='flex gap-1 items-center'>
          <div className='mr-2'>
            <SegmentedControl
              value={interval}
              onChange={value => setInterval(value as LeaderboardIntervalFilter)}
            >
              <SegmentedControl.Item value='1h' />
              <SegmentedControl.Item value='6h' />
              <SegmentedControl.Item value='24h' />
              <SegmentedControl.Item value='7d' />
              <SegmentedControl.Item value='30d' />
            </SegmentedControl>
          </div>

          <AssetSelector assets={assets} balances={balances} value={base} onChange={setBase} />
          <Text large color='text.secondary'>
            /
          </Text>
          <AssetSelector assets={assets} balances={balances} value={quote} onChange={setQuote} />
        </div>
      </div>

      <div ref={parent} className='grid grid-cols-6 h-auto overflow-auto'>
        <div className='grid grid-cols-subgrid col-span-6'>
          <TableCell heading>Position</TableCell>
          <TableCell heading>Executions</TableCell>
          <TableCell heading>Fees1</TableCell>
          <TableCell heading>Volume1</TableCell>
          <TableCell heading>Fees2</TableCell>
          <TableCell heading>Volume2</TableCell>
        </div>

        {positions?.map((position, index) => (
          <Link
            href={`/inspect/lp/${position.positionId}`}
            key={position.positionId}
            className={cn(
              'relative grid grid-cols-subgrid col-span-6',
              'bg-transparent hover:bg-action-hoverOverlay transition-colors',
            )}
          >
            <TableCell
              numeric
              variant={index !== positions.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              <div className='flex max-w-[104px]'>
                <Text as='div' detailTechnical color='text.primary' truncate>
                  {position.positionId}
                </Text>
                <span>
                  <SquareArrowOutUpRight className='w-4 h-4 text-text-secondary' />
                </span>
              </div>
            </TableCell>
            <TableCell
              numeric
              variant={index !== positions.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              {position.executions}
            </TableCell>
            <TableCell
              numeric
              variant={index !== positions.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              <ValueViewComponent valueView={position.fees1} abbreviate={true} />
            </TableCell>
            <TableCell
              numeric
              variant={index !== positions.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              <ValueViewComponent valueView={position.volume1} abbreviate={true} />
            </TableCell>
            <TableCell
              numeric
              variant={index !== positions.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              <ValueViewComponent valueView={position.fees2} abbreviate={true} />
            </TableCell>
            <TableCell
              numeric
              variant={index !== positions.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              <ValueViewComponent valueView={position.volume2} abbreviate={true} />
            </TableCell>
          </Link>
        ))}
      </div>
    </>
  );
};
