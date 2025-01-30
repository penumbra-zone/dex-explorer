import { useQuery } from '@tanstack/react-query';
import { connectionStore } from '@/shared/model/connection';
import { penumbra } from '@/shared/const/penumbra';
import { ViewService } from '@penumbra-zone/protobuf';
import { LatestSwapsResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';

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
  return useQuery({
    queryKey: ['my-trades', subaccount],
    queryFn: () => fetchQuery(subaccount),
    retry: 1,
    enabled: connectionStore.connected,
  });
};
