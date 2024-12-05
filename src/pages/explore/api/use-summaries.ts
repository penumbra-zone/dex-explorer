'use client';

import { useQuery } from '@tanstack/react-query';
import { SummaryData } from '@/shared/api/server/summary/types';
import { DurationWindow } from '@/shared/utils/duration';
import { apiFetch } from '@/shared/utils/api-fetch';

const BASE_LIMIT = 15;
const BASE_OFFSET = 0;
const BASE_WINDOW: DurationWindow = '1d';

export const useSummaries = () => {
  return useQuery({
    queryKey: ['summaries', BASE_LIMIT, BASE_OFFSET],
    queryFn: async () => {
      return apiFetch<SummaryData[]>('/api/summaries', {
        limit: BASE_LIMIT.toString(),
        offset: BASE_OFFSET.toString(),
        durationWindow: BASE_WINDOW,
      });
    },
  });
};
