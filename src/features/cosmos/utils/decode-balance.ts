import { assets } from 'chain-registry';
import type { Asset } from '@chain-registry/types';
import type { Balance } from '../types';

export const decodeBalance = (balance: Balance, chainAssets: Asset[]): Balance => {
    // Handle native token
    if (!balance.denom.startsWith('ibc/')) {
        const asset = chainAssets.find(a => a.base === balance.denom);
        if (!asset) {
            return balance;
        }

        const displayUnit = asset.denom_units.find(u => u.denom === asset.display);
        const decimals = displayUnit?.exponent ?? 6;
        const amount = parseFloat(balance.amount) / Math.pow(10, decimals);

        return {
            ...balance,
            symbol: asset.symbol,
            displayAmount: `${amount.toFixed(2)} ${asset.symbol}`,
        };
    }

    // Handle IBC tokens
    const ibcHash = balance.denom.replace('ibc/', '');
    for (const chainAssets of assets) {
        for (const asset of chainAssets.assets) {
            if (!asset.traces) {
                continue;
            }

            const matchingTrace = asset.traces.find(t => {
                if (t.type !== 'ibc') {
                    return false;
                }

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
                    symbol: asset.symbol,
                    displayAmount: `${amount.toFixed(2)} ${asset.symbol}`,
                };
            }
        }
    }

    return balance;
}; 