import { useCallback, useEffect, useState } from 'react';
import { getChainConfigs } from './utils/chain-configs';
import { decodeBalance } from './utils/decode-balance';
import { fetchChainBalances } from './utils/fetch-balances';
import type { Balance } from './types';

export const useCosmosBalances = (address?: string) => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const fetchBalances = useCallback(async (userAddress: string) => {
    const chains = getChainConfigs();
    return fetchChainBalances(userAddress, chains);
  }, []);

  useEffect(() => {
    if (!address) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    fetchBalances(address)
      .then(setBalances)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to fetch balances'),
      )
      .finally(() => setIsLoading(false));
  }, [address, fetchBalances]);

  return { balances, isLoading, error };
};
