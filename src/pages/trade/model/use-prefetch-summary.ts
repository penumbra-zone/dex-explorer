import { PathParams } from '@/pages/trade/model/use-path';
import { getSummary } from '@/shared/api/server/summary';
import { DurationWindow } from '@/shared/utils/duration.ts';
import { getQueryClient } from '@/shared/const/queryClient';
import { useServerParams } from '@/shared/utils/server-params';

export const usePrefetchSummary = (window: DurationWindow) => {
  const queryClient = getQueryClient();
  const { baseSymbol, quoteSymbol } = useServerParams<PathParams>();

  return {
    queryClient,
    prefetch: () =>
      queryClient.prefetchQuery({
        queryKey: ['summary', baseSymbol, quoteSymbol],
        queryFn: async () => {
          const paramsObj = {
            durationWindow: window,
            baseAsset: baseSymbol,
            quoteAsset: quoteSymbol,
          };
          const baseUrl = 'https://localhost/api/summary';
          const urlParams = new URLSearchParams(paramsObj).toString();
          const res = await getSummary({ url: `${baseUrl}?${urlParams}` });
          if ('error' in res) {
            throw new Error(res.error);
          }
          return {
            ...res,
            asset_start: res.asset_start.toJSON(),
            asset_end: res.asset_end.toJSON(),
          };
        },
      }),
  };
};
