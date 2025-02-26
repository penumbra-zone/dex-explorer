import { useState, useEffect } from 'react';
import { fetchChainBalances } from './utils/fetch-balances';
import { useWallet } from '@cosmos-kit/react';
import { Balance } from '@/features/cosmos/types.ts';

/**
 * Hook that augments Cosmos balances with Penumbra-specific data
 *
 * This scans balances across all supported chains and adds:
 * - Display information (symbol, denom, amount)
 * - Asset icons
 * - Asset type information
 * - A flag indicating if an asset is a Penumbra asset (can be transferred via IBC)
 */
export const useBalances = () => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { chainWallets, status } = useWallet();

  useEffect(() => {
    const scanAllChains = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const allBalances: Balance[] = [];

        // For each chain, try to fetch balances
        await Promise.all(
          chainWallets.map(async chain => {
            try {
              // Get the address for this chain
              const address = chain.address;

              if (!address) {
                return;
              }

              // Fetch balances for this chain
              const chainBalances = await fetchChainBalances(address, chain);
              allBalances.push(...chainBalances);
            } catch (err) {
              console.warn(`Error fetching balances for chain ${chain.chainId}:`, err);
            }
          }),
        );

        setBalances(allBalances);
      } catch (err) {
        console.error('Error scanning balances:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    void scanAllChains();
  }, [status]);
  return {
    balances,
    isLoading: isLoading,
    error: error,
  };
};
