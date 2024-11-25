import { useQuery } from '@tanstack/react-query';
import type { StatsResponse, StatsData, StatsJSONData } from '@/shared/api/server/stats';
import { DurationWindow } from '@/shared/utils/duration';
import { ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

const deserializeStats = (json: StatsJSONData): StatsData => {
  return {
    ...json,
    largestPairLiquidity: json.largestPairLiquidity
      ? ValueView.fromJson(json.largestPairLiquidity)
      : undefined,
    liquidity: ValueView.fromJson(json.liquidity),
    directVolume: ValueView.fromJson(json.directVolume),
  };
};

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

      return deserializeStats(jsonRes);
    },
  });
};
