import { useCallback, useEffect, useState } from 'react';
import { getChainConfigs } from './utils/chain-configs';
import { fetchChainBalances } from './utils/fetch-balances';
import type { Balance } from './types';

export const useCosmosBalances = (address?: string) => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const fetchBalances = useCallback(async (userAddress: string) => {
    const chains = getChainConfigs();
    const result = await fetchChainBalances(userAddress, chains);
    return result;
  }, []);

  useEffect(() => {
    if (!address) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    void fetchBalances(address)
      .then(setBalances)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to fetch balances';
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [address, fetchBalances]);

  return { balances, isLoading, error };
};
