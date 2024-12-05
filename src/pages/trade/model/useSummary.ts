import { useQuery } from '@tanstack/react-query';
import { usePathSymbols } from '@/pages/trade/model/use-path.ts';
import { DurationWindow } from '@/shared/utils/duration.ts';
import { NoSummaryData, SummaryData } from '@/shared/api/server/summary/types.ts';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block.ts';
import { innerFetch } from '@/shared/utils/inner-fetch';

export const useSummary = (window: DurationWindow) => {
  const { baseSymbol, quoteSymbol } = usePathSymbols();

  const query = useQuery({
    queryKey: ['summary', baseSymbol, quoteSymbol],
    retry: 1,
    queryFn: async () => {
      return innerFetch<SummaryData | NoSummaryData>('/api/summary', {
        durationWindow: window,
        baseAsset: baseSymbol,
        quoteAsset: quoteSymbol,
      });
    },
  });

  useRefetchOnNewBlock(query);

  return query;
};
