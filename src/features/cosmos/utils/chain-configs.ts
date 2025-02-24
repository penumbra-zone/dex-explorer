import { assets, chains } from 'chain-registry';
import type { Chain } from '@chain-registry/types';
import type { ChainConfig } from '../types';

export const getChainConfigs = (): ChainConfig[] => {
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
