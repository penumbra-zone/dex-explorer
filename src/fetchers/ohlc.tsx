import { useQuery } from '@tanstack/react-query';
import { CandlestickData } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

export const useOHLC = (
  symbol1: string,
  symbol2: string,
  startBlock: number | null,
  limit: number,
) => {
  return useQuery({
    queryKey: ['ohlc', startBlock],
    queryFn: async (): Promise<CandlestickData[]> => {
      if (startBlock === null) {
        return [];
      }

      return (await fetch(`/api/ohlc/${symbol1}/${symbol2}/${startBlock}/${limit}`).then(resp =>
        resp.json(),
      )) as CandlestickData[];
    },
  });
};
