import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/utils/api-fetch.ts';
import { NoSummaryData, SummaryData } from '@/shared/api/server/summary/types.ts';

/**
 * Hook to fetch asset prices for a list of assets
 * Uses the same summaries API that the explore page uses
 * Only returns prices denominated in USDC
 */
export const useAssetPrices = (symbols: string[] = []) => {
  const query = useQuery({
    queryKey: ['summary', symbols],
    retry: 1,
    queryFn: async () => {
      const results = await Promise.allSettled(
        symbols.map(symbol =>
          apiFetch<SummaryData | NoSummaryData>('/api/summary', {
            durationWindow: '1h',
            baseAsset: symbol,
            quoteAsset: 'USDC',
          }),
        ),
      );

      // we inject USDC and USDY and hardcode them to 1 USD
      return [
        ...results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value)
          .filter(data => 'price' in data)
          .map(data => ({
            symbol: data.baseAsset.symbol,
            price: data.price,
          })),
        {
          symbol: 'USDC',
          price: 1,
        },

        {
          symbol: 'USDY',
          price: 1,
        },
      ];
    },
  });

  return query;
};
