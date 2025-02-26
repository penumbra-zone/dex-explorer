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
    const response = await fetch(`${url}/cosmos/bank/v1beta1/balances/${chainAddress}`);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as BankBalancesResponse;
    return data.balances
      .filter(b => b.amount !== '0')
      .map(b => decodeBalance({ ...b, chain: chain.chainId }, chain.assets));
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to fetch balances');
  }
};
