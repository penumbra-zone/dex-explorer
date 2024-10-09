import { ViewService } from '@penumbra-zone/protobuf';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { penumbra } from '@/shared/penumbra';
import { connectionStore } from '@/shared/state/connection';
import { useQuery } from '@tanstack/react-query';

const fetchQuery = async (): Promise<BalancesResponse[]> => {
  return Array.fromAsync(penumbra.service(ViewService).balances({}));
};

export const useBalances = () => {
  return useQuery({
    queryKey: ['balances'],
    queryFn: fetchQuery,
    enabled: connectionStore.connected,
  });
};
