'use client';

import { useQuery } from '@tanstack/react-query';
import type { StatsData } from '@/shared/api/server/stats';
import { innerFetch } from '@/shared/utils/inner-fetch';

export const useStats = () => {
  return useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: async () => {
      return innerFetch<StatsData>('/api/stats');
    },
  });
};