'use client';

import { useQuery } from '@tanstack/react-query';
import type { LeaderboardPageInfo, LeaderboardSearchParams } from './utils';
import { apiFetch } from '@/shared/utils/api-fetch';

export const useLeaderboard = (filters: Partial<LeaderboardSearchParams>) => {
  return useQuery<LeaderboardPageInfo>({
    queryKey: ['leaderboard', filters.interval, filters.base, filters.quote, filters.limit],
    queryFn: async () => {
      console.log('QUEYR', filters);
      return apiFetch<LeaderboardPageInfo>('/api/position/leaderboard', filters);
    },
  });
};
