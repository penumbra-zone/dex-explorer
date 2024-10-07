import { makeAutoObservable, when } from 'mobx';
import { ViewService } from '@penumbra-zone/protobuf';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { penumbra } from '@/shared/penumbra';
import { connectionStore } from '@/shared/state/connection';
import { queryClient } from '@/shared/queryClient';

const fetchBalances = () => {
  return queryClient.fetchQuery({
    queryKey: ['balances'],
    queryFn: async () => Array.fromAsync(penumbra.service(ViewService).balances({})),
  });
};

class BalancesState {
  /** The error is set in case of a request failure */
  error?: string;
  balances: BalancesResponse[] = [];

  constructor() {
    makeAutoObservable(this);

    when(
      () => connectionStore.connected,
      () => void this.setup(),
    );
  }

  async setup() {
    try {
      this.setBalances(await fetchBalances());
    } catch (error) {
      this.setError(error instanceof Error ? `${error.name}: ${error.message}` : 'Request error');
    }
  }

  setError = (value?: string) => {
    this.error = value;
  }

  setBalances = (value: BalancesResponse[]) => {
    this.balances = value;
  }
}

export const balancesStore = new BalancesState();
