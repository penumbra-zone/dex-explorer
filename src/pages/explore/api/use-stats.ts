'use client';

import { useQuery } from '@tanstack/react-query';
import type { StatsDataJSON, StatsData, StatsResponseJSON } from '@/shared/api/server/stats';
import { ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

export const useStats = () => {
  const { data, ...rest } = useQuery<StatsDataJSON>({
    queryKey: ['stats'],
    queryFn: async () => {
      const baseUrl = '/api/stats';
      const fetchRes = await fetch(baseUrl);
      const jsonRes = (await fetchRes.json()) as StatsResponseJSON;
      if ('error' in jsonRes) {
        throw new Error(jsonRes.error);
      }

      return jsonRes;
    },
  });

  const stats = data && {
    ...data,
    largestPairLiquidity: data.largestPairLiquidity ? ValueView.fromJson(data.largestPairLiquidity) : undefined,
    liquidity: ValueView.fromJson(data.liquidity),
    directVolume: ValueView.fromJson(data.directVolume),
  } satisfies StatsData;

  return {
    ...rest,
    data: stats,
  };
};
