import { useQuery } from '@tanstack/react-query';
import { connectionStore } from '@/shared/model/connection';
import { AssetId, Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';

export const DUMMY_UM_METADATA = new Metadata({
  denomUnits: [
    {
      denom: 'penumbra',
      exponent: 6,
    },
    {
      denom: 'mpenumbra',
      exponent: 3,
    },
    {
      denom: 'upenumbra',
    },
  ],
  base: 'upenumbra',
  name: 'Penumbra',
  display: 'penumbra',
  symbol: 'UM',
  penumbraAssetId: new AssetId({ inner: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]) }),
  images: [
    {
      svg: 'https://raw.githubusercontent.com/prax-wallet/registry/main/images/um.svg',
    },
  ],
  badges: [
    {
      svg: 'https://raw.githubusercontent.com/prax-wallet/registry/refs/heads/main/images/full-moon-face.svg',
    },
  ],
});

export const useTotalRewards = () => {
  return useQuery<ValueView>({
    queryKey: ['my-total-rewards'],
    enabled: connectionStore.connected,
    queryFn: async () => {
      return new Promise((resolve) => {
        // REMOVE after using actual data
        setTimeout(() => {
          resolve(new ValueView({
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
          }));
        }, 1000);
      })
    },
  });
};
