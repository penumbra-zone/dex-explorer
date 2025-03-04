import { bech32 } from 'bech32';
import type { Balance, BankBalancesResponse } from '../types';
import { decodeBalance } from './decode-balance';
import { ChainWalletBase } from '@cosmos-kit/core';

export const fetchChainBalances = async (
  userAddress: string,
  chain: ChainWalletBase,
): Promise<Balance[]> => {
  try {
    const decoded = bech32.decode(userAddress);
    const addressBytes = bech32.fromWords(decoded.words);

    const chainAddress = bech32.encode(
      chain.chainRecord.chain?.bech32_prefix ?? '',
      bech32.toWords(addressBytes),
    );
    const endpoint = await chain.getRestEndpoint();
    const url = typeof endpoint === 'string' ? endpoint : endpoint.url;

    try {
      const response = await fetch(`${url}/cosmos/bank/v1beta1/balances/${chainAddress}`);

      if (!response.ok) {
        console.warn(
          `Failed to fetch balances for chain ${chain.chainId}: ${response.status} ${response.statusText}`,
        );
        return [];
      }

      const data = (await response.json()) as BankBalancesResponse;

      return data.balances
        .filter(b => b.amount !== '0')
        .map(b => decodeBalance({ ...b, chain: chain.chainId }, chain.assets));
    } catch (fetchError) {
      console.warn(`Failed to fetch balances for chain ${chain.chainId}:`, fetchError);
      return []; // Return empty array on fetch error
    }
  } catch (err) {
    console.error(`Error in fetchChainBalances for chain ${chain.chainId}:`, err);
    return []; // Return empty array instead of throwing to avoid breaking the UI
  }
};
