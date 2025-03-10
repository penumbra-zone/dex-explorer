import { fetchChainBalances } from './utils/fetch-balances';
import { useWallet } from '@cosmos-kit/react';
import { Balance } from '@/features/cosmos/types.ts';
import { useQuery } from '@tanstack/react-query';
import { WalletStatus } from '@cosmos-kit/core';
import { useRegistry } from '@/shared/api/registry';
import { balanceToValueView } from './utils/balance-to-value-view';
import { usePenumbraIbcDenoms } from '@/features/penumbra/penumbra-ibc-utils';

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
  const { data: registry } = useRegistry();
  const { ibcDenoms: penumbraIbcDenoms = [] } = usePenumbraIbcDenoms();

  const fetchAllChainBalances = async (): Promise<Balance[]> => {
    const allBalances: Balance[] = [];

    // For each chain, try to fetch balances
    await Promise.all(
      chainWallets.map(async chain => {
        try {
          // Get the address for this chain
          const address = chain.address;

          if (!address) {
            console.debug(`No address available for chain ${chain.chainId}`);
            return;
          }

          // Fetch balances for this chain
          const chainBalances = await fetchChainBalances(address, chain);
          if (chainBalances.length === 0) {
            console.debug(`No balances found for chain ${chain.chainId}`);
          } else {
            console.debug(`Found ${chainBalances.length} balances for chain ${chain.chainId}`);
          }
          allBalances.push(...chainBalances);
        } catch (err) {
          console.warn(`Error fetching balances for chain ${chain.chainId}:`, err);
        }
      }),
    );

    // Filter out unrecognized assets
    const filteredBalances = allBalances.filter(balance => {
      console.debug(`Checking balance: ${balance.denom} on ${balance.chain}`);

      // If the balance has a symbol, we consider it recognized
      if (balance.symbol) {
        // Filter out LP tokens (which often have long, cryptic symbols)
        if (
          balance.symbol.includes('gamm/pool/') ||
          balance.symbol.toLowerCase().includes('lp') ||
          (balance.denom.startsWith('gamm/') && !balance.denom.includes('channel'))
        ) {
          console.debug(
            `Filtering out LP token: ${balance.symbol || balance.denom} on ${balance.chain}`,
          );
          return false;
        }
        return true;
      }

      // For IBC tokens, check if they're in our registry
      if (balance.denom.startsWith('ibc/')) {
        // IMPORTANT: Be more lenient with IBC token filtering to prevent assets from disappearing
        // If we have a registry, check if the asset is recognized by trying to get a known asset ID
        if (registry) {
          const valueView = balanceToValueView(balance, registry, penumbraIbcDenoms);
          const isRecognized = valueView.valueView.case === 'knownAssetId';

          // If this is a Penumbra IBC denom, always include it
          const isPenumbraAsset = penumbraIbcDenoms.includes(balance.denom);

          if (isPenumbraAsset) {
            console.debug(`Including Penumbra asset: ${balance.denom} on ${balance.chain}`);
            return true;
          }

          if (!isRecognized) {
            console.debug(
              `Filtering out unrecognized IBC token: ${balance.denom} on ${balance.chain}`,
            );
          }
          return isRecognized;
        }

        // Without a registry, we'll include the IBC token to be less restrictive
        console.debug(
          `No registry available, but including IBC token: ${balance.denom} on ${balance.chain}`,
        );
        return true;
      }

      // For non-IBC tokens without a symbol, we consider them unrecognized
      console.debug(`Filtering out token without symbol: ${balance.denom} on ${balance.chain}`);
      return false;
    });

    return filteredBalances;
  };

  const result = useQuery({
    queryKey: [
      'cosmos-balances',
      status,
      chainWallets.map(chain => chain.chainId).join(','),
      // Use a stable string representation of the registry to avoid unnecessary invalidation
      registry ? 'registry-available' : 'no-registry',
    ],
    queryFn: fetchAllChainBalances,
    enabled: status === WalletStatus.Connected && chainWallets.length > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff starting at 1s
  });

  // Return empty balances array when wallet is not connected
  // This ensures components don't treat it as "loading" when wallet is not connected
  return {
    balances: result.data ?? [],
    isLoading: result.isLoading && status === WalletStatus.Connected,
    error: result.error ? String(result.error) : null,
    refetch: result.refetch,
  };
};
