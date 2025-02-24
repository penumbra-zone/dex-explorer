import { useEffect, useState, useCallback } from 'react';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { Wallet2 } from 'lucide-react';
import type { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { assets, chains } from 'chain-registry';
import type { Asset, Chain } from '@chain-registry/types';
import { bech32 } from 'bech32';

// Extend Window type with wallet interfaces
declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => OfflineDirectSigner;
    };
    leap?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => OfflineDirectSigner;
    };
  }
}

interface Balance {
  denom: string;
  amount: string;
  chain: string;
  displayAmount?: string;
}

interface ChainConfig {
  chainId: string;
  restEndpoint: string;
  chain: Chain & { bech32_prefix: string };
  assets: Asset[];
}

interface BankBalancesResponse {
  balances: {
    denom: string;
    amount: string;
  }[];
  pagination?: {
    next_key: string | null;
    total: string;
  };
}

// Get all mainnet chains from the registry that have REST endpoints
const getChainConfigs = (): ChainConfig[] => {
  return chains
    .filter((chain): chain is Chain & { bech32_prefix: string } => {
      return (!chain.network_type || chain.network_type === 'mainnet') && !!chain.bech32_prefix;
    })
    .map(chain => {
      const restEndpoint = chain.apis?.rest?.[0]?.address;
      if (!restEndpoint) {
        return null;
      }

      const chainAssets = assets.find(a => a.chain_name === chain.chain_name)?.assets ?? [];

      return {
        chainId: chain.chain_id,
        restEndpoint,
        chain,
        assets: chainAssets,
      } as ChainConfig;
    })
    .filter((chain): chain is ChainConfig => chain !== null);
};

export const CosmosBalances = () => {
  const [address, setAddress] = useState<string>();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [formattedBalances, setFormattedBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [chains, setChains] = useState<ChainConfig[]>([]);

  useEffect(() => {
    setChains(getChainConfigs());
  }, []);

  const getOfflineSigner = async (chainId: string): Promise<OfflineDirectSigner | null> => {
    const provider = window.keplr ?? window.leap;
    if (!provider) {
      return null;
    }

    try {
      await provider.enable(chainId);
      return provider.getOfflineSigner(chainId);
    } catch (err) {
      console.warn(`Failed to get signer for ${chainId}:`, err);
      return null;
    }
  };

  const fetchBalances = async (userAddress: string) => {
    const allBalances: Balance[] = [];

    // Get the original address bytes
    const decoded = bech32.decode(userAddress);
    const addressBytes = bech32.fromWords(decoded.words);

    // Fetch balances from all chains in parallel
    await Promise.all(
      chains.map(async chain => {
        try {
          // Convert the address to the chain's bech32 prefix
          const chainPrefix = chain.chain.bech32_prefix;
          const chainAddress = bech32.encode(chainPrefix, bech32.toWords(addressBytes));

          // Use the bank module's balances endpoint
          const response = await fetch(
            `${chain.restEndpoint}/cosmos/bank/v1beta1/balances/${chainAddress}`,
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = (await response.json()) as BankBalancesResponse;

          // Add non-zero balances
          for (const balance of data.balances) {
            if (balance.amount !== '0') {
              console.log(`Balance for ${chain.chainId}:`, balance);
              allBalances.push({
                denom: balance.denom,
                amount: balance.amount,
                chain: chain.chainId,
              });
            }
          }
        } catch (err) {
          // console.warn(`Failed to fetch balances for ${chain.chainId}:`, err);
        }
      }),
    );

    return allBalances;
  };

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      if (!window.keplr && !window.leap) {
        setError('Please install Keplr or Leap wallet extension');
        return;
      }

      // We only need to connect to one chain to get the address
      const signer = await getOfflineSigner('cosmoshub-4');
      if (!signer) {
        setError('Failed to connect to wallet');
        return;
      }

      const accounts = await signer.getAccounts();
      const userAddress = accounts[0]?.address;
      if (!userAddress) {
        setError('No address found in wallet');
        return;
      }

      setAddress(userAddress);
      const allBalances = await fetchBalances(userAddress);
      setBalances(allBalances);
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = useCallback(
    (balance: Balance): Balance => {
      try {
        const chain = chains.find(c => c.chainId === balance.chain);
        if (!chain) {
          console.debug(`Chain not found for balance: ${JSON.stringify(balance)}`);
          return {
            ...balance,
            displayAmount: `${balance.amount} ${balance.denom}`,
          };
        }

        // Handle native token first
        if (!balance.denom.startsWith('ibc/')) {
          const asset = chain.assets.find(a => a.base === balance.denom);
          if (!asset) {
            console.debug(`Native asset not found: ${balance.denom} on ${chain.chainId}`);
            return {
              ...balance,
              displayAmount: `${balance.amount} ${balance.denom}`,
            };
          }

          const displayUnit = asset.denom_units.find(u => u.denom === asset.display);
          const decimals = displayUnit?.exponent ?? 6;
          const amount = parseFloat(balance.amount) / Math.pow(10, decimals);

          return {
            ...balance,
            displayAmount: `${amount.toFixed(2)} ${asset.symbol}`,
          };
        }

        // Handle IBC tokens
        const ibcHash = balance.denom.replace('ibc/', '');

        // Search through all assets in the chain registry for this IBC hash
        for (const chainAssets of assets) {
          for (const asset of chainAssets.assets) {
            if (!asset.traces) {
              continue;
            }

            const matchingTrace = asset.traces.find(t => {
              if (t.type !== 'ibc') {
                return false;
              }

              // Check if trace has a path property
              if (!('path' in t)) {
                return false;
              }

              const tracePath = t.path;
              if (typeof tracePath !== 'string') {
                return false;
              }

              return tracePath.includes(ibcHash);
            });

            if (matchingTrace) {
              const displayUnit = asset.denom_units.find(u => u.denom === asset.display);
              const decimals = displayUnit?.exponent ?? 6;
              const amount = parseFloat(balance.amount) / Math.pow(10, decimals);

              return {
                ...balance,
                displayAmount: `${amount.toFixed(2)} ${asset.symbol}`,
              };
            }
          }
        }

        console.debug(`IBC token not found in registry: ${balance.denom} on ${chain.chainId}`);
        return {
          ...balance,
          displayAmount: `${balance.amount} ${balance.denom}`,
        };
      } catch (err) {
        console.warn('Failed to format balance:', err);
        return {
          ...balance,
          displayAmount: `${balance.amount} ${balance.denom}`,
        };
      }
    },
    [chains],
  );

  useEffect(() => {
    const formatted = balances.map(formatBalance);
    setFormattedBalances(formatted);
  }, [balances, formatBalance]);

  if (!address) {
    return (
      <div className='flex flex-col gap-2'>
        <Button icon={Wallet2} onClick={() => void connect()} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'View Cosmos Balances'}
        </Button>
        {error && <Text>{error}</Text>}
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      <Text small>Cosmos Address: {address}</Text>
      {formattedBalances.length === 0 && <Text>No tokens found</Text>}
      {formattedBalances.map(balance => (
        <Text key={`${balance.chain}-${balance.denom}`}>
          {balance.displayAmount} ({balance.chain})
        </Text>
      ))}
      {error && <Text>{error}</Text>}
    </div>
  );
};
