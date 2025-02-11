'use client';

import cn from 'clsx';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import type { LeaderboardData } from '../api/query-leaderboard';
import { useRouter, useSearchParams } from 'next/navigation';
import { PagePath } from '@/shared/const/pages';
import { Serialized, deserialize } from '@/shared/utils/serializer';
import { useTransition } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export interface LeaderboardTableProps {
  data: Serialized<LeaderboardData[]>;
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

  return (
    <div ref={parent} className='grid grid-cols-4 pt-4 px-4 pb-0 h-auto overflow-auto'>
      <div className='grid col-span-4'>
        <button onClick={reload}>refresh</button>
      </div>
      <div className='grid grid-cols-subgrid col-span-4'>
        <TableCell heading>Time</TableCell>
        <TableCell heading>Executions</TableCell>
        <TableCell heading>Fees</TableCell>
        <TableCell heading>Volume</TableCell>
      </div>

      {positions.map((position, index) => (
        <div
          key={index}
          className={cn(
            'relative grid grid-cols-subgrid col-span-4',
          )}
        >
          <TableCell numeric variant={index !== data.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            ABC
          </TableCell>
          <TableCell numeric variant={index !== data.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            {position.executionCount}
          </TableCell>
          <TableCell numeric variant={index !== data.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            {position.fees2}
          </TableCell>
          <TableCell numeric variant={index !== data.length - 1 ? 'cell' : 'lastCell'} loading={isLoading}>
            {position.volume1}
          </TableCell>
        </div>
      ))}
    </div>
  );
}
