import { describe, expect, it } from 'vitest';
import type { Asset } from '@chain-registry/types';
import { decodeBalance } from './decode-balance';
import type { Balance } from '../types';

describe('decodeBalance', () => {
  const mockAssets: Asset[] = [
    {
      name: 'Osmosis',
      symbol: 'OSMO',
      denom_units: [
        { denom: 'uosmo', exponent: 0 },
        { denom: 'osmo', exponent: 6 },
      ],
      base: 'uosmo',
      display: 'osmo',
      description: 'The native token of Osmosis',
      logo_URIs: {
        png: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png',
      },
    },
  ];

  it('should decode native token', () => {
    const balance: Balance = {
      denom: 'uosmo',
      amount: '1000000',
      chain: 'osmosis-1',
    };

    const result = decodeBalance(balance, mockAssets);
    expect(result).toEqual({
      ...balance,
      symbol: 'OSMO',
      displayAmount: '1.00 OSMO',
    });
  });

  it('should return original balance for unknown native token', () => {
    const balance: Balance = {
      denom: 'unknown',
      amount: '1000000',
      chain: 'osmosis-1',
    };

    const result = decodeBalance(balance, mockAssets);
    expect(result).toEqual(balance);
  });

  it('should decode IBC token', () => {
    const mockIbcAssets: Asset[] = [
      {
        name: 'Atom',
        symbol: 'ATOM',
        denom_units: [
          { denom: 'uatom', exponent: 0 },
          { denom: 'atom', exponent: 6 },
        ],
        base: 'uatom',
        display: 'atom',
        traces: [
          {
            type: 'ibc',
            counterparty: {
              chain_name: 'cosmoshub',
              base_denom: 'uatom',
            },
            path: 'transfer/channel-0/uatom',
          },
        ],
      },
    ];

    const balance: Balance = {
      denom: 'ibc/transfer/channel-0/uatom',
      amount: '1000000',
      chain: 'osmosis-1',
    };

    const result = decodeBalance(balance, mockIbcAssets);
    expect(result).toEqual({
      ...balance,
      symbol: 'ATOM',
      displayAmount: '1.00 ATOM',
    });
  });

  it('should return original balance for unknown IBC token', () => {
    const balance: Balance = {
      denom: 'ibc/unknown',
      amount: '1000000',
      chain: 'osmosis-1',
    };

    const result = decodeBalance(balance, mockAssets);
    expect(result).toEqual(balance);
  });
});
