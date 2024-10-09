import { ViewService } from '@penumbra-zone/protobuf';
import { getDenomMetadata } from '@penumbra-zone/getters/assets-response';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { penumbra } from '@/shared/penumbra';
import { connectionStore } from '@/shared/state/connection';
import { useQuery } from '@tanstack/react-query';
import { useEnv } from '@/fetchers/env';

export const useAssets = () => {
  const { data: env, isLoading } = useEnv();
  const chainId = !isLoading ? env?.PENUMBRA_CHAIN_ID : process.env['PENUMBRA_CHAIN_ID'];

  const registryAssets = useQuery({
    queryKey: ['registry-assets'],
    queryFn: () => {
      const registryClient = new ChainRegistryClient();
      const registry = registryClient.bundled.get(chainId ?? '');
      return registry.getAllAssets();
    },
  });

  const accountAssets = useQuery({
    queryKey: ['assets'],
    enabled: connectionStore.connected,
    queryFn: async () => {
      const responses = await Array.fromAsync(penumbra.service(ViewService).assets({}));
      return responses.map(getDenomMetadata);
    },
  });

  return connectionStore.connected ? accountAssets : registryAssets;
};
