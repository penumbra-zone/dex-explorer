import { useWallet } from '@cosmos-kit/react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ChainWalletBase, WalletStatus } from '@cosmos-kit/core';
import { useRegistry } from '@/shared/api/registry';
import { Chain } from '@penumbra-labs/registry';
import { sha256HashStr } from '@penumbra-zone/crypto-web/sha256';
import { Asset } from '@chain-registry/types';
import { assets as cosmosAssetList } from 'chain-registry';
import { Coin, StargateClient } from '@cosmjs/stargate';

export const fetchChainBalances = async (
  address: string,
  chain: ChainWalletBase,
): Promise<readonly Coin[]> => {
  const endpoint = await chain.getRpcEndpoint();
  const client = await StargateClient.connect(endpoint);
  return client.getAllBalances(address);
};

// Searches for corresponding denom in asset registry and returns the metadata
export const augmentToAsset = (denom: string, chainName: string): Asset => {
  const match = cosmosAssetList
    .find(({ chain_name }) => chain_name === chainName)
    ?.assets.find(asset => asset.base === denom);

  return match ? match : fallbackAsset(denom);
};

const fallbackAsset = (denom: string): Asset => {
  return {
    base: denom,
    denom_units: [{ denom, exponent: 0 }],
    display: denom,
    name: denom,
    symbol: denom,
    type_asset: 'sdk.coin',
  };
};

const generatePenumbraIbcDenoms = async (chains: Chain[]): Promise<string[]> => {
  const ibcAddrs: string[] = [];
  for (const c of chains) {
    const ibcStr = `transfer/${c.counterpartyChannelId}/upenumbra`;
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(ibcStr);

    const hash = await sha256HashStr(encodedString);
    ibcAddrs.push(`ibc/${hash.toUpperCase()}`);
  }
  return ibcAddrs;
};

export const usePenumbraIbcDenoms = () => {
  const { data: registry, isLoading: registryIsLoading, error: registryErr } = useRegistry();

  const {
    data: ibcAddrs,
    isLoading: ibcAddrsLoading,
    error: ibcAddrssErr,
  } = useQuery({
    queryKey: ['penumbraIbcDenoms', registry],
    queryFn: async () => generatePenumbraIbcDenoms(registry?.ibcConnections ?? []),
    enabled: Boolean(registry),
  });

  return {
    data: ibcAddrs,
    isLoading: registryIsLoading || ibcAddrsLoading,
    error: registryErr ?? ibcAddrssErr,
  };
};

export const useBalances = () => {
  const { chainWallets, status } = useWallet();
  const { data: registry } = useRegistry();

  const result = useQueries({
    queries: chainWallets.map(chain => ({
      queryKey: [
        'cosmos-balances',
        status,
        chain.chainId,
        registry ? 'registry-available' : 'no-registry',
      ],
      queryFn: async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- okay
        const balances = await fetchChainBalances(chain.address!, chain);
        return balances.map(coin => {
          return { asset: augmentToAsset(coin.denom, chain.chainName), amount: coin.amount };
        });
      },
      enabled: status === WalletStatus.Connected && chainWallets.length > 0,
      retry: 3, // Retry failed requests 3 times
      // retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff starting at 1s
    })),
    combine: results => {
      return {
        data: results
          .map(result => result.data)
          .flat(2)
          .filter(Boolean),
        isLoading: results.some(result => result.isLoading),
        error: results.find(r => r.error !== null)?.error ?? null,
        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- this is fine.
        refetch: results.forEach(result => void result.refetch()),
      };
    },
  });

  return {
    balances: result.data,
    isLoading: result.isLoading && status === WalletStatus.Connected,
    error: result.error ? String(result.error) : null,
    refetch: result,
  };
};
