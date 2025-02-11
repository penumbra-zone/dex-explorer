'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import cn from 'clsx';
import { Text } from '@penumbra-zone/ui/Text';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import { PagePath } from '@/shared/const/pages';
import { Serialized, deserialize } from '@/shared/utils/serializer';
import type { LeaderboardData } from '../api/query-leaderboard';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import Link from 'next/link';
import { SquareArrowOutUpRight } from 'lucide-react';

export interface LeaderboardTableProps {
  data: Serialized<LeaderboardData[] | string>;
}

export const LeaderboardTable = ({ data }: LeaderboardTableProps) => {
  const [parent] = useAutoAnimate();
  const [isLoading, startTransition] = useTransition();

  const router = useRouter();
  const searchParams = useSearchParams();
  const positions = deserialize(data);

  const reload = () => {
    startTransition(() => {
      const search = new URLSearchParams(searchParams ?? undefined);
      search.set('limit', '5');
      router.push(`${PagePath.LpLeaderboard}?${search.toString()}`);
    });
  };

  if (typeof positions === 'string') {
    return (
      <Text large color='destructive.light'>
        {positions}
      </Text>
    );
  }

  return (
    <div ref={parent} className='grid grid-cols-6 pt-4 px-4 pb-0 h-auto overflow-auto'>
      <div className='grid col-span-4'>
        <button onClick={reload}>refresh</button>
      </div>
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
          <TableCell numeric variant={index !== positions.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            <div className='flex max-w-[104px]'>
              <Text as='div' detailTechnical color='text.primary' truncate>
                {position.positionId}
              </Text>
              <span>
                <SquareArrowOutUpRight className='w-4 h-4 text-text-secondary' />
              </span>
            </div>
          </TableCell>
          <TableCell numeric variant={index !== positions.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            {position.executions}
          </TableCell>
          <TableCell numeric variant={index !== positions.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            <ValueViewComponent valueView={position.fees1} abbreviate={true} />
          </TableCell>
          <TableCell numeric variant={index !== positions.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            <ValueViewComponent valueView={position.volume1} abbreviate={true} />
          </TableCell>
          <TableCell numeric variant={index !== positions.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            <ValueViewComponent valueView={position.fees2} abbreviate={true} />
          </TableCell>
          <TableCell numeric variant={index !== positions.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            <ValueViewComponent valueView={position.volume2} abbreviate={true} />
          </TableCell>
        </Link>
      ))}
    </div>
  );
}
