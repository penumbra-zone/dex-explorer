// @ts-nocheck
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchChainBalances } from './fetch-balances';
import type { ChainConfig } from '../types';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('fetchChainBalances', () => {
  const mockChains: ChainConfig[] = [
    {
      chainId: 'osmosis-1',
      restEndpoint: 'https://rest.osmosis.zone',
      chain: {
        chain_id: 'osmosis-1',
        chain_name: 'osmosis',
        bech32_prefix: 'osmo',
      } as ChainConfig['chain'],
      assets: [],
    },
    {
      chainId: 'cosmoshub-4',
      restEndpoint: 'https://rest.cosmos.directory/cosmoshub',
      chain: {
        chain_id: 'cosmoshub-4',
        chain_name: 'cosmoshub',
        bech32_prefix: 'cosmos',
      } as ChainConfig['chain'],
      assets: [],
    },
  ];

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch balances from multiple chains', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            balances: [
              { denom: 'uosmo', amount: '1000000' },
              { denom: 'ibc/uatom', amount: '2000000' },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            balances: [{ denom: 'uatom', amount: '3000000' }],
          }),
      });

    const result = await fetchChainBalances('cosmos1...', mockChains);

    expect(result).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toContain('osmosis-1');
    expect(mockFetch.mock.calls[1][0]).toContain('cosmoshub-4');
  });

  it('should handle failed chain requests gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            balances: [{ denom: 'uatom', amount: '3000000' }],
          }),
      });

    const result = await fetchChainBalances('cosmos1...', mockChains);

    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle invalid bech32 address', async () => {
    await expect(fetchChainBalances('invalid', mockChains)).rejects.toThrow();
  });

  it('should filter out zero balances', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          balances: [
            { denom: 'uosmo', amount: '0' },
            { denom: 'uatom', amount: '1000000' },
          ],
        }),
    });

    const result = await fetchChainBalances('cosmos1...', [mockChains[0]]);

    expect(result).toHaveLength(1);
    expect(result[0]?.amount).toBe('1000000');
  });
});
