import { useQuery } from '@tanstack/react-query';
import { StatsResponse, StatsData } from '@/shared/api/server/stats';
import { DurationWindow } from '@/shared/utils/duration';

export const useStats = () => {
  return useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: async () => {
      const baseUrl = '/api/stats';
      const urlParams = new URLSearchParams({
        durationWindow: '1d' satisfies DurationWindow,
      }).toString();

      const fetchRes = await fetch(`${baseUrl}?${urlParams}`);
      const jsonRes = (await fetchRes.json()) as StatsResponse;
      if ('error' in jsonRes) {
        throw new Error(jsonRes.error);
      }
      return jsonRes;
    },
  });
};
