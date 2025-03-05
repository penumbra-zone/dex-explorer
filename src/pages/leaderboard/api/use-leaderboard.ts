'use client';

import { useQuery } from '@tanstack/react-query';
import type { LeaderboardPageInfo, LeaderboardSearchParams } from './utils';
import { apiFetch } from '@/shared/utils/api-fetch';
import { DexService } from '@penumbra-zone/protobuf';
import { penumbra } from '@/shared/const/penumbra';
import { PositionId } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { positionIdFromBech32 } from '@penumbra-zone/bech32m/plpid';

export const useLeaderboard = (filters: Partial<LeaderboardSearchParams>) => {
  return useQuery<LeaderboardPageInfo>({
    queryKey: [
      'leaderboard',
      filters.startBlock,
      filters.endBlock,
      filters.quote,
      filters.limit,
      filters.offset,
    ],
    queryFn: async () => {
      const resp = await apiFetch<LeaderboardPageInfo>('/api/position/leaderboard', {
        ...(filters.quote && { quote: filters.quote }),
        startBlock: filters.startBlock,
        endBlock: filters.endBlock,
        limit: filters.limit,
        offset: filters.offset,
      } as unknown as Record<string, string>);

      return resp;
    },
  });
};
