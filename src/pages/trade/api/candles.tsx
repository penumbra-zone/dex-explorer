import { useQuery } from '@tanstack/react-query';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block.ts';
import { Candle, CandleApiResponse } from '@/shared/api/server/candles/types.ts';
import { usePathSymbols } from '@/pages/trade/model/use-path-to-metadata.ts';

export const useCandles = () => {
  const { baseSymbol, quoteSymbol } = usePathSymbols();

  const query = useQuery({
    queryKey: ['candles', baseSymbol, quoteSymbol],
    queryFn: async (): Promise<Candle[]> => {
      const paramsObj = {
        baseAsset: baseSymbol,
        quoteAsset: quoteSymbol,
        startDate: '2024-10-31',
        endDate: '2024-08-01',
        durationWindow: '1d',
      };
      const baseUrl = '/api/candles-v2';
      const urlParams = new URLSearchParams(paramsObj).toString();
      const res = await fetch(`${baseUrl}?${urlParams}`);
      const jsonRes = (await res.json()) as CandleApiResponse;
      if ('error' in jsonRes) {
        throw new Error(jsonRes.error);
      }
      return jsonRes;
    },
  });

  useRefetchOnNewBlock(query);

  return query;
};
