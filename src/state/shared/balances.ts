import { makeAutoObservable, runInAction, when } from 'mobx';
import { ViewService } from '@penumbra-zone/protobuf';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { penumbra } from '@/utils/penumbra';
import { connectionStore } from '@/state/connection';

class BalancesState {
  /** If true, ignore all other state values */
  loading = false;
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
      runInAction(() => this.loading = true);
      this.balances = await Array.fromAsync(penumbra.service(ViewService).balances({}));
      this.loading = false;
    } catch (error) {
      this.error = error instanceof Error ? `${error.name}: ${error.message}` : 'Request error';
    }
  }
}

export const balancesStore = new BalancesState();
