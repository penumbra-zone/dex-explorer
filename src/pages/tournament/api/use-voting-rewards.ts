import { useQuery } from '@tanstack/react-query';
import { Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { connectionStore } from '@/shared/model/connection';
import { DUMMY_VALUE_VIEW, DUMMY_UM_METADATA, DUMMY_USDC_METADATA } from './dummy';

export const BASE_LIMIT = 10;
export const BASE_PAGE = 1;

export interface VotingReward {
  epoch: number;
  reward: ValueView;
  vote: {
    percent: number;
    asset: Metadata;
  };
}

const DUMMY_VOTING_REWARDS: VotingReward[] = Array.from({ length: 55 }, (_, i) => ({
  epoch: i + 1,
  reward: DUMMY_VALUE_VIEW,
  vote: {
    percent: Math.floor(Math.random() * 100 + 1),
    asset: Math.random() > 0.5 ? DUMMY_UM_METADATA : DUMMY_USDC_METADATA,
  },
}));

export const useVotingRewards = (page = BASE_PAGE, limit = BASE_LIMIT) => {
  const query = useQuery<VotingReward[]>({
    queryKey: ['my-voting-rewards', page, limit],
    enabled: connectionStore.connected,
    queryFn: async () => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(DUMMY_VOTING_REWARDS.slice(limit * (page - 1), limit * page));
        }, 1000);
      });
    },
  });

  return {
    query,
    total: DUMMY_VOTING_REWARDS.length,
  };
};
