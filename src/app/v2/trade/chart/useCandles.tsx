import ms from 'milliseconds';
import last from 'lodash/last';
import { useBlockInfo, useBlockTimestamps } from '../../../../fetchers/block';
import { useCandles as useCandlesFetcher } from '../../../../fetchers/candles';
import { CandlestickData } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

const { fromEntries } = Object;

function getStartBlockHeight(currentBlockHeight: number | null, msTime: number): number | null {
  if (currentBlockHeight === null) {
    return null;
  }

  const blockTime = ms.seconds(5);
  return Math.max(1, currentBlockHeight - Math.trunc(msTime / blockTime));
}

interface CandlesResult {
  loading: boolean;
  data: CandlestickData[];
}

export function useCandles(): CandlesResult {
  // const timestampsByHeight = useRef<Record<string, string>>({});

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

  // get current block info
  const { data: blockInfo } = useBlockInfo(1);
  const currentBlockHeight = blockInfo?.[0]?.height;
  const startBlockHeight = getStartBlockHeight(
    currentBlockHeight ?? null,
    ms.days(7) as number,
  );

  const limit = 10000;
  console.log("TCL: currentBlockHeight", currentBlockHeight);

  const { data: candles } = useCandlesFetcher(
    asset1.symbol,
    asset2.symbol,
    0,
    limit,
  );

  const { data: blockTimestamps } = useBlockTimestamps(candles?.[0]?.height, last(candles)?.height);

  const timestampsByHeight = fromEntries(
    blockTimestamps?.map(block => [block.height, block.created_at]) || [],
  );

  const candlesWithTime = candles?
    .filter(candle => timestampsByHeight[candle.height])
    .map(candle => ({
      ...candle,
      time: new Date(timestampsByHeight[candle.height]).getTime(),
    }));

  return {
    loading: !candlesWithTime?.length,
    data: candlesWithTime ?? [],
  };
}
