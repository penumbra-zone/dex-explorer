import { makeAutoObservable, when } from 'mobx';
import { ViewService } from '@penumbra-zone/protobuf';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { getDenomMetadata } from '@penumbra-zone/getters/assets-response';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { Constants } from '@/shared/configConstants';
import { penumbra } from '@/shared/penumbra';
import { connectionStore } from '@/shared/state/connection';
import { queryClient } from '@/shared/queryClient';

const fetchAssets = () => {
  return queryClient.fetchQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const responses = await Array.fromAsync(penumbra.service(ViewService).assets({}));
      return responses.map(getDenomMetadata);
    },
  });
};

class AssetsState {
  /** The error is set in case of a request failure */
  error?: string;
  assets: Metadata[] = [];

  constructor() {
    makeAutoObservable(this);

    when(
      () => !connectionStore.connected,
      () => this.getRegistryAssets(),
    );

    when(
      () => connectionStore.connected,
      () => void this.fetchAccountAssets(),
    );
  }

  getRegistryAssets () {
    const registryClient = new ChainRegistryClient();
    const registry = registryClient.bundled.get(Constants.chainId);
    this.setAssets(registry.getAllAssets());
  }

  async fetchAccountAssets() {
    try {
      this.setAssets(await fetchAssets());
    } catch (error) {
      this.setError(error instanceof Error ? `${error.name}: ${error.message}` : 'Request error');
    }
  }

  setError = (value?: string) => {
    this.error = value;
  }

  setAssets = (value: Metadata[]) => {
    this.assets = value;
  }
}

export const assetsStore = new AssetsState();
