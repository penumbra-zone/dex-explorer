import { bech32 } from 'bech32';
import type { Balance, BankBalancesResponse, ChainConfig } from '../types';
import { decodeBalance } from './decode-balance';

export const fetchChainBalances = async (
    userAddress: string,
    chains: ChainConfig[],
): Promise<Balance[]> => {
    const allBalances: Balance[] = [];

    try {
        // Get the original address bytes for conversion
        const decoded = bech32.decode(userAddress);
        const addressBytes = bech32.fromWords(decoded.words);

        // Fetch balances from all chains in parallel
        await Promise.all(
            chains.map(async chain => {
                try {
                    const chainAddress = bech32.encode(
                        chain.chain.bech32_prefix,
                        bech32.toWords(addressBytes),
                    );
                    const response = await fetch(
                        `${chain.restEndpoint}/cosmos/bank/v1beta1/balances/${chainAddress}`,
                    );

                    if (!response.ok) {
                        return;
                    }

                    const data = (await response.json()) as BankBalancesResponse;
                    const nonZeroBalances = data.balances
                        .filter(b => b.amount !== '0')
                        .map(b => decodeBalance({ ...b, chain: chain.chainId }, chain.assets));

                    allBalances.push(...nonZeroBalances);
                } catch {
                    // Silently fail for individual chains
                    return;
                }
            }),
        );

        return allBalances;
    } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch balances');
        throw error;
    }
};
