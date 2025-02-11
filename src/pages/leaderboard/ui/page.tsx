'use server';

import { queryLeaderboard } from '../api/query-leaderboard';
import { LeaderboardTable } from './table';
import { serialize } from '@/shared/utils/serializer';

export interface LeaderboardPageProps {
  searchParams: Promise<{
    limit?: string;
  }>
}

export const LeaderboardPage = async ({ searchParams }: LeaderboardPageProps) => {
  const { limit } = await searchParams;
  console.log('LOADING', limit);
  const data = await queryLeaderboard(limit ? parseInt(limit) : 30);

  return (
    <section className='text-text-primary'>
      <h1>Leaderboard</h1>
      <LeaderboardTable data={serialize(data)} />
    </section>
  );
};
