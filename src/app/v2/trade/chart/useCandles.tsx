import { useCandles as useCandlesFetcher } from '../../../../fetchers/candles';
import { CandlestickData } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

interface CandlesResult {
  loading: boolean;
  data: CandlestickData[];
}

export function useCandles(): CandlesResult {
  const asset1 = {
    display: 'Penumbra',
    symbol: 'um',
    decimals: 5,
  };
  const asset2 = {
    display: 'GM Wagmi',
    symbol: 'gm',
    decimals: 5,
  };

  const limit = 10000;

  const { data } = useCandlesFetcher(asset1.symbol, asset2.symbol, 0, limit);

  return {
    loading: !data?.length,
    data: data ?? [],
  };
}
