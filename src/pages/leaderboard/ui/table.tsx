'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useTransition } from 'react';
import cn from 'clsx';
import { Text } from '@penumbra-zone/ui/Text';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import { PagePath } from '@/shared/const/pages';
import { Serialized, deserialize } from '@/shared/utils/serializer';
import { LeaderboardPageInfo } from '../api/query-leaderboard';
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

export interface LeaderboardTableProps {
  data: Serialized<LeaderboardPageInfo | string>;
}

export const LeaderboardTable = ({ data }: LeaderboardTableProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deserialized = deserialize(data);

  const [parent] = useAutoAnimate();
  const [isLoading, startTransition] = useTransition();

  const { data: assets } = useAssets();
  const { data: balances } = useBalances();

  // Updates the URL query param and quietly reloads the page with loading skeletons
  const updateFilter = (key: string, value: string) => {
    startTransition(() => {
      const search = new URLSearchParams(searchParams ?? undefined);
      search.set(key, value);
      router.push(`${PagePath.LpLeaderboard}?${search.toString()}`);
    });
  };

  const baseAsset = useMemo(() => {
    if (typeof deserialized !== 'object' || !deserialized.filters.base) {
      return undefined;
    }
    return assets?.find(asset => asset.symbol === deserialized.filters.base);
  }, [deserialized, assets]);

  const quoteAsset = useMemo(() => {
    if (typeof deserialized !== 'object' || !deserialized.filters.quote) {
      return undefined;
    }
    return assets?.find(asset => asset.symbol === deserialized.filters.quote);
  }, [deserialized, assets]);

  const onBaseChange = (value: AssetSelectorValue) => {
    const symbol = isBalancesResponse(value)
      ? getMetadataFromBalancesResponse(value).symbol
      : value.symbol;
    updateFilter('base', symbol);
  };

  const onQuoteChange = (value: AssetSelectorValue) => {
    const symbol = isBalancesResponse(value)
      ? getMetadataFromBalancesResponse(value).symbol
      : value.symbol;
    updateFilter('quote', symbol);
  };

  if (typeof deserialized === 'string') {
    return (
      <Text large color='destructive.light'>
        {deserialized}
      </Text>
    );
  }

  const { data: positions } = deserialized;

  return (
    <>
      <div className='flex gap-4 justify-between items-center text-text-primary'>
        <Text large whitespace='nowrap'>
          Leaderboard
        </Text>

        <div className='flex gap-1 items-center'>
          <AssetSelector
            assets={assets}
            balances={balances}
            value={baseAsset}
            onChange={onBaseChange}
          />
          <Text large color='text.secondary'>
            /
          </Text>
          <AssetSelector
            assets={assets}
            balances={balances}
            value={quoteAsset}
            onChange={onQuoteChange}
          />
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

        {positions.map((position, index) => (
          <Link
            href={`/inspect/lp/${position.positionId}`}
            key={index}
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
