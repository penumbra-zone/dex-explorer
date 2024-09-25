import { useQuery } from '@tanstack/react-query';
import { CandlestickData } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

export const useOHLC = (asset1: string, asset2: string, startBlock: number, limit: number) => {
  return useQuery({
    queryKey: ['ohlc'],
    queryFn: async (): Promise<CandlestickData[]> => {
      return (await fetch(`/api/ohlc/${asset1}/${asset2}/${startBlock}/${limit}`).then(resp =>
        resp.json(),
      )) as CandlestickData[];
    },
  });
};
