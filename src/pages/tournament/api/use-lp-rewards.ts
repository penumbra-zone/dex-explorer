import { useQuery } from '@tanstack/react-query';
import { PositionId } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { connectionStore } from '@/shared/model/connection';
import { DUMMY_UM_METADATA } from './use-total-rewards';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';

export const BASE_LIMIT = 10;
export const BASE_PAGE = 1;

export interface Reward {
  epoch: number;
  positionId: PositionId;
  reward: ValueView;
  isWithdrawn: boolean;
}

const DUMMY_LP_REWARDS: Reward[] = Array.from({ length: 55 }, (_, i) => ({
  epoch: i + 1,
  positionId: new PositionId({
    inner: new Uint8Array([
      i + 1,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      0,
      10,
    ]),
  }),
  isWithdrawn: i % 2 === 0,
  reward: new ValueView({
    valueView: {
      case: 'knownAssetId',
      value: {
        metadata: DUMMY_UM_METADATA,
        amount: new Amount({
          lo: 9_000_000_000n,
          hi: 0n,
        }),
      },
    },
  }),
}));

export const useLpRewards = (page = BASE_PAGE, limit = BASE_LIMIT) => {
  const query = useQuery<Reward[]>({
    queryKey: ['my-lp-rewards', page, limit],
    enabled: connectionStore.connected,
    queryFn: async () => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(DUMMY_LP_REWARDS.slice(limit * (page - 1), limit * page));
        }, 1000);
      });
    },
  });

  return {
    query,
    total: DUMMY_LP_REWARDS.length,
  };
};
