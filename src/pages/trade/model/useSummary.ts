import { useQueries, useQuery } from '@tanstack/react-query';
import { usePathSymbols } from '@/pages/trade/model/use-path.ts';
import { DurationWindow } from '@/shared/utils/duration.ts';
import { NoSummaryData, SummaryData } from '@/shared/api/server/summary/types.ts';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block.ts';
import { apiFetch } from '@/shared/utils/api-fetch';

export const useSummary = (window: DurationWindow) => {
  const { baseSymbol, quoteSymbol } = usePathSymbols();

  const query = useQuery({
    queryKey: ['summary', baseSymbol, quoteSymbol],
    retry: 1,
    queryFn: async () => {
      return apiFetch<SummaryData | NoSummaryData>('/api/summary', {
        durationWindow: window,
        baseAsset: baseSymbol,
        quoteAsset: quoteSymbol,
      });
    },
  });

  useRefetchOnNewBlock('summary', query);

  return query;
};

// Fetch USDC-denominated prices for each quote asset to enable cross-pair comparisons.
// Uses 'useQueries' hook for handling multiple dynamic numbers of queries
export const useMultipleSummaries = (quoteAssets: string[]) => {
  const queries = useQueries<Array<{ data: SummaryData | NoSummaryData | undefined }>>({
    queries: quoteAssets.map(asset => ({
      queryKey: ['multipleSummaries', asset, 'USDC'] as const,
      queryFn: async () => {
        return apiFetch<SummaryData | NoSummaryData>('/api/summary', {
          durationWindow: '1d' as DurationWindow,
          baseAsset: asset,
          quoteAsset: 'USDC',
        });
      },
    })),
  });

  // TODO: add block-based fetching

  return queries;
};
