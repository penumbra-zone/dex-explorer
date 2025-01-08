import { useQueries, useQuery } from '@tanstack/react-query';
import { DurationWindow } from '@/shared/utils/duration.ts';
import { NoSummaryData, SummaryData } from '@/shared/api/server/summary/types.ts';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block.ts';
import { apiFetch } from '@/shared/utils/api-fetch';
import { PairData } from '@/shared/api/server/summary/pairs';

export const useSummaries = (pairs: PairData[]) => {
    // Create a dummy query that will never refetch if there are no pairs
    const dummyQuery = useQuery({
        queryKey: ['summary', 'dummy'],
        queryFn: () => Promise.resolve(null),
        enabled: pairs.length === 0,
    });

    const queries = useQueries({
        queries: pairs.map(pair => ({
            queryKey: ['summary', pair.baseAsset.symbol, pair.quoteAsset.symbol],
            retry: 1,
            queryFn: async () => {
                return apiFetch<SummaryData | NoSummaryData>('/api/summary', {
                    durationWindow: '1d' as DurationWindow,
                    baseAsset: pair.baseAsset.symbol,
                    quoteAsset: pair.quoteAsset.symbol,
                });
            },
        })),
    });

    // Use the first real query for refetch if available, otherwise use the dummy query
    useRefetchOnNewBlock('summary', queries[0] ?? dummyQuery);

    return queries;
}; 