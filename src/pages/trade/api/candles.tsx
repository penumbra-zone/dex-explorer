import { useQuery } from '@tanstack/react-query';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block.ts';
import { CandleApiResponse } from '@/shared/api/server/candles/types.ts';
import { usePathSymbols } from '@/pages/trade/model/use-path.ts';
import { OhlcData } from 'lightweight-charts';
import { DurationWindow } from '@/shared/database/schema.ts';

const DEX_ENABLED_DATE = '2024-08-01';

export const useCandles = (durationWindow: DurationWindow) => {
  const { baseSymbol, quoteSymbol } = usePathSymbols();

  const query = useQuery({
    queryKey: ['candles', baseSymbol, quoteSymbol, durationWindow, DEX_ENABLED_DATE],
    queryFn: async (): Promise<OhlcData[]> => {
      const todayIso = new Date().toISOString().split('T')[0];
      if (!todayIso) {
        throw new Error("Unable to generate today's date as an iso string");
      }
      const paramsObj = {
        baseAsset: baseSymbol,
        quoteAsset: quoteSymbol,
        startDate: todayIso,
        endDate: DEX_ENABLED_DATE,
        durationWindow,
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
