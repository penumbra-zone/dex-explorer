'use server';

import { queryLeaderboard } from '../api/query-leaderboard';
import { LeaderboardTable } from './table';
import { PenumbraWaves } from '@/pages/explore/ui/waves';

export interface LeaderboardPageProps {
  searchParams: Promise<Record<string, string>>
}

export const LeaderboardPage = async ({ searchParams }: LeaderboardPageProps) => {
  const data = await queryLeaderboard(new URLSearchParams(await searchParams));

  return (
    <section className='flex flex-col gap-6 p-4 max-w-[1062px] mx-auto'>
      <PenumbraWaves />
      <h1>Leaderboard</h1>
      <LeaderboardTable data={data} />
    </section>
  );
};
