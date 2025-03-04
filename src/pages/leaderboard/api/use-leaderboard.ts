'use client';

import { useQuery } from '@tanstack/react-query';
import type { LeaderboardPageInfo, LeaderboardSearchParams } from './utils';
import { apiFetch } from '@/shared/utils/api-fetch';

export const useLeaderboard = (filters: Partial<LeaderboardSearchParams>) => {
  return useQuery<LeaderboardPageInfo>({
    queryKey: ['leaderboard', filters.startBlock, filters.endBlock, filters.quote, filters.limit],
    queryFn: async () => {
      return apiFetch<LeaderboardPageInfo>('/api/position/leaderboard', {
        limit: filters.limit,
        ...(filters.quote && { quote: filters.quote }),
        startBlock: filters.startBlock,
        endBlock: filters.endBlock,
      } as unknown as Record<string, string>);
    },
  });
};
