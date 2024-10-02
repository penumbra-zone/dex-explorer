import { Token } from "@/utils/types/token";
import { useCandles as useCandlesFetcher } from '@/fetchers/candles';
import { CandlestickData } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

interface CandlesResult {
  loading: boolean;
  data: CandlestickData[];
}

export function useCandles(asset1: Token, asset2: Token): CandlesResult {
  const limit = 10000;
  const { data } = useCandlesFetcher(asset1.symbol, asset2.symbol, 0, limit);

  return {
    loading: !data?.length,
    data: data ?? [],
  };
}
