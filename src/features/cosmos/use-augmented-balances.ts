import { fetchChainBalances } from './utils/fetch-balances';
import { useWallet } from '@cosmos-kit/react';
import { Balance } from '@/features/cosmos/types.ts';
import { useQuery } from '@tanstack/react-query';
import { WalletStatus } from '@cosmos-kit/core';

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
  const { chainWallets, status } = useWallet();

  const fetchAllChainBalances = async (): Promise<Balance[]> => {
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

    return allBalances;
  };

  const result = useQuery({
    queryKey: ['cosmos-balances', status, chainWallets.map(chain => chain.chainId).join(',')],
    queryFn: fetchAllChainBalances,
    enabled: status === WalletStatus.Connected && chainWallets.length > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff starting at 1s
  });

  return {
    balances: result.data ?? [],
    isLoading: result.isLoading,
    error: result.error ? String(result.error) : null,
    refetch: result.refetch,
  };
};
