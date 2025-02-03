import { useQuery } from '@tanstack/react-query';
import { connectionStore } from '@/shared/model/connection';
import { penumbra } from '@/shared/const/penumbra';
import { ViewService } from '@penumbra-zone/protobuf';
import { LatestSwapsResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { DirectedTradingPair } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { RecentExecution } from '@/shared/api/server/recent-executions';
import { deserialize, Serialized } from '@/shared/utils/serializer';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block';
import { usePathToMetadata } from '@/pages/trade/model/use-path';

const fetchQuery = async (subaccount?: number, base?: AssetId, quote?: AssetId): Promise<LatestSwapsResponse[]> => {
  if (typeof subaccount === 'undefined' || !base || !quote) {
    return [];
  }

  const accountFilter = typeof subaccount === 'undefined' ? undefined : new AddressIndex({ account: subaccount });
  const swaps = await Promise.all([
    Array.fromAsync(
      penumbra.service(ViewService).latestSwaps({
        pair: new DirectedTradingPair({ start: base, end: quote }),
        accountFilter,
      })),
    Array.fromAsync(
      penumbra.service(ViewService).latestSwaps({
        pair: new DirectedTradingPair({ start: quote, end: base }),
        accountFilter,
      })),
  ]);

  return swaps.flat();
};

/**
 * Must be used within the `observer` mobX HOC
 */
export const useLatestSwaps = (subaccount?: number) => {
  const { baseAsset, quoteAsset, baseSymbol, quoteSymbol } = usePathToMetadata();

  const { data, isLoading } = useQuery({
    queryKey: ['my-trades', subaccount, baseSymbol, quoteSymbol],
    queryFn: () => fetchQuery(subaccount, baseAsset?.penumbraAssetId, quoteAsset?.penumbraAssetId),
    retry: 1,
    enabled: connectionStore.connected,
  });

  const query = useQuery({
    queryKey: ['my-executions', data?.length ?? 0],
    enabled: !isLoading,
    queryFn: async () => {
      if (!data?.length) {
        return [];
      }

      const mapped = data
        .map(swap => {
          return (
            swap.pair && {
              blockHeight: Number(swap.blockHeight),
              start: swap.pair.start,
              end: swap.pair.end,
            }
          );
        })
        .filter(Boolean);

      const fetchRes = await fetch(`/api/my-executions`, {
        method: 'POST',
        body: JSON.stringify(mapped),
      });

      const jsonRes = (await fetchRes.json()) as Serialized<RecentExecution[] | { error: string }>;

      if ('error' in jsonRes) {
        throw new Error(jsonRes.error);
      }

      if (Array.isArray(jsonRes)) {
        return jsonRes.map(deserialize) as RecentExecution[];
      }

      return deserialize(jsonRes);
    },
  });

  useRefetchOnNewBlock('my-executions', query);

  return query;
};
