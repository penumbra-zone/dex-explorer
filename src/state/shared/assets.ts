import { makeAutoObservable, runInAction, when } from 'mobx';
import { ViewService } from '@penumbra-zone/protobuf';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { getDenomMetadata } from '@penumbra-zone/getters/assets-response';
import { penumbra } from '@/utils/penumbra';
import { connectionStore } from '@/state/connection';

class AssetsState {
  /** If true, ignore all other state values */
  loading = false;
  /** The error is set in case of a request failure */
  error?: string;
  assets: Metadata[] = [];

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
      const responses = await Array.fromAsync(penumbra.service(ViewService).assets({}));
      this.assets = responses.map(getDenomMetadata);
      this.loading = false;
    } catch (error) {
      this.error = error instanceof Error ? `${error.name}: ${error.message}` : 'Request error';
    }
  }
}

export const assetsStore = new AssetsState();
