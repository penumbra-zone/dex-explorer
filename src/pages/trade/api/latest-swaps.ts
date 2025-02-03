import { useQuery } from '@tanstack/react-query';
import { connectionStore } from '@/shared/model/connection';
import { penumbra } from '@/shared/const/penumbra';
import { ViewService } from '@penumbra-zone/protobuf';
import { LatestSwapsResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { RecentExecution } from '@/shared/api/server/recent-executions';
import { deserialize, Serialized } from '@/shared/utils/serializer';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block';

const fetchQuery = async (subaccount?: number): Promise<LatestSwapsResponse[]> => {
  return await Array.fromAsync(
    penumbra.service(ViewService).latestSwaps({
      accountFilter:
        typeof subaccount === 'undefined' ? undefined : new AddressIndex({ account: subaccount }),
    }),
  );
};

/**
 * Must be used within the `observer` mobX HOC
 */
export const useLatestSwaps = (subaccount?: number) => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-trades', subaccount],
    queryFn: () => fetchQuery(subaccount),
    retry: 1,
    enabled: connectionStore.connected,
  });

  const query = useQuery({
    queryKey: ['my-executions', data?.length ?? 0],
    enabled: !isLoading,
    queryFn: async () => {
      console.log('REQUEST', data, isLoading);
      if (!data?.length) {
        return [];
      }

      const fetchRes = await fetch(`/api/my-executions`, {
        method: 'POST',
        body: JSON.stringify(
          data.map(swap => ({
            blockHeight: swap.blockHeight,
            start: swap.pair.start,
            end: swap.pair.end,
          })),
        ),
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
