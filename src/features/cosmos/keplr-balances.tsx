import { useState } from 'react';
import { StargateClient } from '@cosmjs/stargate';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { Wallet2 } from 'lucide-react';
import { OfflineSigner } from '@cosmjs/proto-signing';

interface Balance {
  denom: string;
  amount: string;
  chain: string;
}

interface ChainConfig {
  chainId: string;
  rpc: string;
  // Known token denoms and their display properties
  tokens: Record<
    string,
    {
      displayName: string;
      decimals: number;
    }
  >;
}

// Configuration for supported chains and their tokens
const CHAINS: ChainConfig[] = [
  {
    chainId: 'osmosis-1',
    rpc: 'https://rpc.osmosis.zone',
    tokens: {
      uosmo: { displayName: 'OSMO', decimals: 6 },
      'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2': {
        displayName: 'ATOM',
        decimals: 6,
      },
      'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858': {
        displayName: 'USDC',
        decimals: 6,
      },
      'ibc/E7B35499CFBEB0FF5778127AE053DF63C511F6213E3D11B5141F4E46F05E753F': {
        displayName: 'UM',
        decimals: 6,
      },
    },
  },
  {
    chainId: 'cosmoshub-4',
    rpc: 'https://rpc-cosmoshub.ecostake.com',
    tokens: {
      uatom: { displayName: 'ATOM', decimals: 6 },
      'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2': {
        displayName: 'OSMO',
        decimals: 6,
      },
    },
  },
];

export const CosmosBalances = () => {
  const [address, setAddress] = useState<string>();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const getOfflineSigner = async (chainId: string): Promise<OfflineSigner | null> => {
    // Try different wallet providers
    const provider = window.keplr || window.leap;
    if (!provider) return null;

    try {
      await provider.enable(chainId);
      return provider.getOfflineSigner(chainId);
    } catch (err) {
      console.warn(`Failed to get signer for ${chainId}:`, err);
      return null;
    }
  };

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      if (!window.keplr && !window.leap) {
        setError('Please install Keplr or Leap wallet extension');
        return;
      }

      const allBalances: Balance[] = [];

      // Check each chain
      for (const chain of CHAINS) {
        try {
          const signer = await getOfflineSigner(chain.chainId);
          if (!signer) continue;

          const accounts = await signer.getAccounts();
          const userAddress = accounts[0]?.address;
          if (!userAddress) continue;

          if (!address) {
            setAddress(userAddress);
          }

          const client = await StargateClient.connect(chain.rpc);
          const chainBalances = await client.getAllBalances(userAddress);

          // Add all non-zero balances
          for (const balance of chainBalances) {
            if (balance.amount !== '0') {
              allBalances.push({ ...balance, chain: chain.chainId });
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch balances for ${chain.chainId}:`, err);
        }
      }

      setBalances(allBalances);
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: Balance) => {
    const chain = CHAINS.find(c => c.chainId === balance.chain);
    const token = chain?.tokens[balance.denom];

    if (!token) {
      return `${balance.amount} ${balance.denom} (${balance.chain})`;
    }

    const amount = parseFloat(balance.amount) / Math.pow(10, token.decimals);
    return `${amount.toFixed(6)} ${token.displayName} (${balance.chain})`;
  };

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
      {balances.length === 0 && <Text>No tokens found</Text>}
      {balances.map(balance => (
        <Text key={`${balance.chain}-${balance.denom}`}>{formatBalance(balance)}</Text>
      ))}
      {error && <Text>{error}</Text>}
    </div>
  );
};
