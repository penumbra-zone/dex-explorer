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
    queryKey: ['leaderboard', filters.startBlock, filters.endBlock, filters.quote, filters.limit],
    queryFn: async () => {
      const resp = await apiFetch<LeaderboardPageInfo>('/api/position/leaderboard', {
        limit: filters.limit,
        ...(filters.quote && { quote: filters.quote }),
        startBlock: filters.startBlock,
        endBlock: filters.endBlock,
      } as unknown as Record<string, string>);
      console.log('TCL: resp', resp);

      const positionIds = resp.data.map(d => new PositionId(positionIdFromBech32(d.positionId)));

      const positionsRes = await Array.fromAsync(
        penumbra.service(DexService).liquidityPositionsById({ positionId: positionIds }),
      );
      if (positionsRes.length !== resp.data.length) {
        throw new Error('owned id array does not match the length of the positions response');
      }
      const positions = positionsRes.map(r => r.data).filter(Boolean) as Position[];

      return {
        ...resp,
        data: resp.data.map(d => ({
          ...d,
          position: positions.find(p => p.id === d.positionId),
        })),
      };
    },
  });
};
