import { ChainRegistryClient, Registry } from '@penumbra-labs/registry';
import { useQuery } from '@tanstack/react-query';

export const chainRegistryClient = new ChainRegistryClient();

export const useRegistry = (chainId: string) => {
  return useQuery({
    queryKey: ['penumbraRegistry'],
    queryFn: async (): Promise<Registry> => {
      return chainRegistryClient.remote.get(chainId);
    },
    staleTime: Infinity,
  });
};