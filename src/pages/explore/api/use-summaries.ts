'use client';

import { useQuery } from '@tanstack/react-query';
import { DurationWindow } from '@/shared/utils/duration.ts';
import { SummaryDataResponse } from '@/shared/api/server/summary/types';
import { SummariesResponse } from '@/shared/api/server/summary/all';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block.ts';

const BASE_LIMIT = 15;
const BASE_WINDOW: DurationWindow = '1d';

export const useSummaries = () => {
  const query = useQuery({
    queryKey: ['summaries'],
    // TODO: why does the query keep refetching every 5 seconds?
    retry: false,
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    queryFn: async () => {
      const paramsObj = {
        durationWindow: BASE_WINDOW,
        limit: BASE_LIMIT.toString(),
        offset: '0',
      };

      const baseUrl = '/api/summaries';
      const urlParams = new URLSearchParams(paramsObj).toString();
      const fetchRes = await fetch(`${baseUrl}?${urlParams}`);
      const jsonRes = (await fetchRes.json()) as SummariesResponse;
      if ('error' in jsonRes) {
        throw new Error(jsonRes.error);
      }

      return jsonRes.map(res => SummaryDataResponse.fromJson(res));
    },
  });

  useRefetchOnNewBlock(query);

  return query;
};
