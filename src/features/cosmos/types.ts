import type { Asset, Chain } from '@chain-registry/types';

export interface Balance {
  denom: string;
  amount: string;
  chain: string;
  symbol?: string;
  displayAmount?: string;
}

export interface ChainConfig {
  chainId: string;
  restEndpoint: string;
  chain: Chain & { bech32_prefix: string };
  assets: Asset[];
}

export interface BankBalancesResponse {
  balances: {
    denom: string;
    amount: string;
  }[];
}
