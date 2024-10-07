import { ChainRegistryClient, Registry } from '@penumbra-labs/registry';
import { useQuery } from '@tanstack/react-query';
import { useEnv } from './env';

export const chainRegistryClient = new ChainRegistryClient();

export const useRegistry = () => {
  const { data: env } = useEnv();
  const chainId = env?.PENUMBRA_CHAIN_ID;

  return useQuery({
    queryKey: ['penumbraRegistry', chainId],
    queryFn: async (): Promise<Registry | null> => {
      if (!chainId) {
        return null;
      }
      return chainRegistryClient.remote.get(chainId);
    },
    staleTime: Infinity,
  });
};