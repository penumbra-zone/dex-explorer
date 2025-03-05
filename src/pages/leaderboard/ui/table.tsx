'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useState, useMemo, useCallback } from 'react';
import cn from 'clsx';
import orderBy from 'lodash/orderBy';
import { Text } from '@penumbra-zone/ui/Text';
import { Card } from '@penumbra-zone/ui/Card';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import { SegmentedControl } from '@penumbra-zone/ui/SegmentedControl';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import Link from 'next/link';
import { SquareArrowOutUpRight, ChevronUp, ChevronDown } from 'lucide-react';
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
import { uint8ArrayToHex } from '@penumbra-zone/types/hex';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { pnum } from '@penumbra-zone/types/pnum';
import { Tabs } from '@penumbra-zone/ui/Tabs';
import { TxDetailsTab } from '@/pages/inspect/tx/ui/tx-viewer';
import { stateToString } from '@/pages/trade/api/positions';
import { formatDistanceToNowStrict } from 'date-fns';

const getAssetId = (value: AssetSelectorValue | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const metadata: Metadata = isBalancesResponse(value)
    ? getMetadataFromBalancesResponse(value)
    : value;

  return metadata.penumbraAssetId?.inner
    ? uint8ArrayToHex(metadata.penumbraAssetId.inner)
    : undefined;
};

export const LeaderboardTable = ({
  startBlock,
  endBlock,
}: {
  startBlock: number;
  endBlock: number;
}) => {
  const [parent] = useAutoAnimate();
  const [quote, setQuote] = useState<AssetSelectorValue>();
  const [tab, setTab] = useState<'All LPs' | 'My LPs'>('All LPs');
  const [sortBy, setSortBy] = useState<{
    key: string;
    direction: 'desc' | 'asc';
  }>({
    key: 'volume2',
    direction: 'desc',
  });

  const quoteAssetId = getAssetId(quote);

  const {
    data: leaderboard,
    error,
    isLoading,
  } = useLeaderboard({
    limit: 10,
    quote: quoteAssetId,
    startBlock,
    endBlock,
  });

  const { data: assets } = useAssets();
  const { data: balances } = useBalances();
  const { data: positions } = leaderboard ?? {};
  console.log('TCL: positions', positions);

  const sortedPositions = useMemo(() => {
    return orderBy(
      (positions ?? []).map(position => ({
        ...position,
        sortValues: {
          positionId: position.positionId,
          executions: position.executions,
          fees1: pnum(position.fees1).toNumber(),
          volume1: pnum(position.volume1).toNumber(),
          fees2: pnum(position.fees2).toNumber(),
          volume2: pnum(position.volume2).toNumber(),
        },
      })),
      `sortValues.${sortBy.key}`,
      sortBy.direction,
    );
  }, [positions, sortBy]);

  const SortableTableHeader = useCallback(
    ({ sortKey, children }: { sortKey: string; children: React.ReactNode }) => {
      return (
        <TableCell heading>
          <button
            className='flex'
            onClick={() => {
              setSortBy({
                key: sortKey,
                direction: sortBy.key === sortKey && sortBy.direction === 'desc' ? 'asc' : 'desc',
              });
            }}
          >
            <Text
              tableHeadingSmall
              whitespace='nowrap'
              color={sortBy.key === sortKey ? 'text.primary' : 'text.secondary'}
            >
              {children}
            </Text>
            {sortKey === sortBy.key && (
              <>
                {sortBy.direction === 'asc' ? (
                  <ChevronUp className='w-4 h-4 text-text-primary' />
                ) : (
                  <ChevronDown className='w-4 h-4 text-text-primary' />
                )}
              </>
            )}
          </button>
        </TableCell>
      );
    },
    [sortBy, setSortBy],
  );

  if (error) {
    return (
      <Text large color='destructive.light'>
        {error.message}
      </Text>
    );
  }

  return (
    <Card>
      <div className='px-2'>
        <div className='flex justify-between items-center mb-4'>
          <Text xxl color='text.primary'>
            LPs Leaderboard
          </Text>

          <AssetSelector assets={assets} balances={balances} value={quote} onChange={setQuote} />
        </div>

        <div className='[&>*>*]:w-1/2 mb-4'>
          <SegmentedControl value={tab} onChange={opt => setTab(opt as 'All LPs' | 'My LPs')}>
            <SegmentedControl.Item
              value='All LPs'
              style={tab === 'All LPs' ? 'filled' : 'unfilled'}
            >
              All LPs
            </SegmentedControl.Item>
            <SegmentedControl.Item value='My LPs' style={tab === 'My LPs' ? 'filled' : 'unfilled'}>
              My LPs
            </SegmentedControl.Item>
          </SegmentedControl>
        </div>

        <div ref={parent} className='grid grid-cols-8 h-auto overflow-auto'>
          <div className='grid grid-cols-subgrid col-span-8'>
            <SortableTableHeader sortKey='executions'>Execs</SortableTableHeader>
            <SortableTableHeader sortKey='points'>Points</SortableTableHeader>
            <SortableTableHeader sortKey='pnl'>PnL</SortableTableHeader>
            <SortableTableHeader sortKey='age'>Age</SortableTableHeader>
            <SortableTableHeader sortKey='volume'>Volume</SortableTableHeader>
            <SortableTableHeader sortKey='fees'>Fees</SortableTableHeader>
            <SortableTableHeader sortKey='state'>State</SortableTableHeader>
            <SortableTableHeader sortKey='positionId'>Position ID</SortableTableHeader>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div className='grid grid-cols-subgrid col-span-8' key={index}>
                <TableCell loading>--</TableCell>
                <TableCell loading>--</TableCell>
                <TableCell loading>--</TableCell>
                <TableCell loading>--</TableCell>
                <TableCell loading>--</TableCell>
                <TableCell loading>--</TableCell>
                <TableCell loading>--</TableCell>
                <TableCell loading>--</TableCell>
              </div>
            ))
          ) : (
            <>
              {sortedPositions.length ? (
                sortedPositions.map((position, index) => (
                  <Link
                    href={`/inspect/lp/${position.positionId}`}
                    key={position.positionId}
                    className={cn(
                      'relative grid grid-cols-subgrid col-span-8',
                      'bg-transparent hover:bg-action-hoverOverlay transition-colors',
                      '[&>*]:h-auto',
                    )}
                  >
                    <TableCell
                      numeric
                      variant={index !== sortedPositions.length - 1 ? 'cell' : 'lastCell'}
                    >
                      {position.executions}
                    </TableCell>
                    <TableCell
                      numeric
                      variant={index !== sortedPositions.length - 1 ? 'cell' : 'lastCell'}
                    >
                      --
                    </TableCell>
                    <TableCell
                      numeric
                      variant={index !== sortedPositions.length - 1 ? 'cell' : 'lastCell'}
                    >
                      --
                    </TableCell>
                    <TableCell
                      numeric
                      variant={index !== sortedPositions.length - 1 ? 'cell' : 'lastCell'}
                    >
                      {formatDistanceToNowStrict(position.openingTime, {
                        addSuffix: false,
                        roundingMethod: 'floor',
                      })
                        .replace(/ minutes?$/, 'm')
                        .replace(/ hours?$/, 'h')
                        .replace(/ days?$/, 'd')
                        .replace(/ weeks?$/, 'w')
                        .replace(/ months?$/, 'mo')}
                    </TableCell>
                    <TableCell
                      numeric
                      variant={index !== sortedPositions.length - 1 ? 'cell' : 'lastCell'}
                    >
                      <div className='flex flex-col gap-2 py-2'>
                        <ValueViewComponent
                          valueView={position.fees1}
                          abbreviate={true}
                          density='slim'
                        />
                        <ValueViewComponent
                          valueView={position.fees2}
                          abbreviate={true}
                          density='slim'
                        />
                      </div>
                    </TableCell>
                    <TableCell
                      numeric
                      variant={index !== sortedPositions.length - 1 ? 'cell' : 'lastCell'}
                    >
                      <div className='flex flex-col gap-2 py-2'>
                        <ValueViewComponent
                          valueView={position.volume1}
                          abbreviate={true}
                          density='slim'
                        />
                        <ValueViewComponent
                          valueView={position.volume2}
                          abbreviate={true}
                          density='slim'
                        />
                      </div>
                    </TableCell>
                    <TableCell
                      numeric
                      variant={index !== sortedPositions.length - 1 ? 'cell' : 'lastCell'}
                    >
                      {stateToString(position.state)}
                    </TableCell>
                    <TableCell
                      numeric
                      variant={index !== sortedPositions.length - 1 ? 'cell' : 'lastCell'}
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
                  </Link>
                ))
              ) : (
                <div className='col-span-6'>
                  <TableCell>Nothing to display.</TableCell>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
