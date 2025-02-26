import { useRegistry } from '@/shared/api/registry';
import { Chain } from '@penumbra-labs/registry';
import { useState, useEffect } from 'react';

/**
 * SHA-256 hash function for strings
 */
const sha256 = async (message: Uint8Array): Promise<string> => {
  // Use the Web Crypto API for hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', message);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

/**
 * Generate Penumbra IBC denominations for each connected chain
 *
 * These denoms represent how Penumbra tokens appear on counterparty chains
 */
export const generatePenumbraIbcDenoms = async (chains: Chain[]): Promise<string[]> => {
  const ibcAddrs: string[] = [];

  for (const chain of chains) {
    // Format: transfer/channelId/upenumbra
    const ibcStr = `transfer/${chain.counterpartyChannelId}/upenumbra`;
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(ibcStr);

    const hash = await sha256(encodedString);
    ibcAddrs.push(`ibc/${hash}`);
  }

  return ibcAddrs;
};

/**
 * React hook to get Penumbra IBC denominations
 */
export const usePenumbraIbcDenoms = () => {
  const [ibcDenoms, setIbcDenoms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: registry } = useRegistry();
  useEffect(() => {
    const fetchDenoms = async () => {
      try {
        setIsLoading(true);
        const denoms = await generatePenumbraIbcDenoms(registry?.ibcConnections ?? []);
        setIbcDenoms(denoms);
      } catch (err) {
        console.error('Failed to fetch Penumbra IBC denoms:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDenoms();
  }, [registry]);

  return { ibcDenoms, isLoading, error };
};
