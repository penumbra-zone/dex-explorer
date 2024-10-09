import { ViewService } from '@penumbra-zone/protobuf';
import { getDenomMetadata } from '@penumbra-zone/getters/assets-response';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { Constants } from '@/shared/configConstants';
import { penumbra } from '@/shared/penumbra';
import { connectionStore } from '@/shared/state/connection';
import { useQuery } from '@tanstack/react-query';

export const useAssets = () => {
  const registryAssets = useQuery({
    queryKey: ['registry-assets'],
    queryFn: () => {
      const registryClient = new ChainRegistryClient();
      const registry = registryClient.bundled.get(Constants.chainId);
      return registry.getAllAssets();
    },
  });

  const accountAssets = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const responses = await Array.fromAsync(penumbra.service(ViewService).assets({}));
      return responses.map(getDenomMetadata);
    },
    enabled: connectionStore.connected,
  });

  return connectionStore.connected ? accountAssets : registryAssets;
};
