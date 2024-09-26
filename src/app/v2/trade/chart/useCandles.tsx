import ms from 'milliseconds';
import last from 'lodash/last';
import { useBlockInfo, useBlockTimestamps } from '../../../../fetchers/block';
import { useOHLC } from '../../../../fetchers/ohlc';
import { CandlestickData } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

const { fromEntries } = Object;

function getStartBlockHeight(currentBlockHeight: number | null, msTime: number): number | null {
  if (currentBlockHeight === null) {
    return null;
  }

  const blockTime = ms.seconds(4);
  return Math.max(1, currentBlockHeight - Math.trunc(msTime / blockTime));
}

// Merge the two arrays, forward will be left alone, however backward will need to
// have 1/price and volumes will have to account for the pricing and decimal difference
function createMergeCandles(asset1Token, asset2Token) {
  function mergeCandle(candle1: CandlestickData, candle2: CandlestickData): CandlestickData {
    const mergedCandle = { ...candle1 };

    // OHLC should be weighted average
    const candle1TotalVolume = candle1.swapVolume + candle1.directVolume;
    const candle2TotalVolume = candle2.swapVolume + candle2.directVolume;

    mergedCandle.open =
      (candle1.open * candle1TotalVolume + candle2.open * candle2TotalVolume) /
      (candle1TotalVolume + candle2TotalVolume);
    mergedCandle.close =
      (candle1.close * candle1TotalVolume + candle2.close * candle2TotalVolume) /
      (candle1TotalVolume + candle2TotalVolume);

    mergedCandle.high = Math.max(candle1.high, candle2.high);
    mergedCandle.low = Math.min(candle1.low, candle2.low);

    mergedCandle.directVolume = candle1.directVolume + candle2.directVolume;
    mergedCandle.swapVolume = candle1.swapVolume + candle2.swapVolume;
    mergedCandle.volume = candle1TotalVolume + candle2TotalVolume;

    return mergedCandle;
  }

  return function mergeCandles(candles1: CandlestickData[], candles2: CandlestickData[]) {
    const normalizedCandles2 = candles2.map((prevCandle: CandlestickData) => {
      const candle = { ...prevCandle };
      candle.open = 1 / candle.open;
      candle.close = 1 / candle.close;
      candle.high = 1 / candle.high;
      candle.low = 1 / candle.low;

      // TODO: Adjust volumes based on price? But what price???
      candle.swapVolume =
        (candle.swapVolume * (1 / candle.close)) /
        10 ** Math.abs(asset2Token.decimals - asset2Token.decimals);
      candle.directVolume =
        (candle.directVolume * (1 / candle.close)) /
        10 ** Math.abs(asset1Token.decimals - asset2Token.decimals);

      return candle;
    });

    // If theres any data at the same height, combine them
    const combinedDataMap = new Map();
    candles1.forEach((candle: CandlestickData) => {
      combinedDataMap.set(candle.height, candle);
    });

    normalizedCandles2.forEach((candle: CandlestickData) => {
      if (combinedDataMap.has(candle.height)) {
        const prevCandle = combinedDataMap.get(candle.height) as CandlestickData;
        const combinedCandle = mergeCandle(prevCandle, candle);
        combinedDataMap.set(candle.height, combinedCandle);
      } else {
        combinedDataMap.set(candle.height, candle);
      }
    });

    // Sort the data by height
    // Put it back into an array
    const sortedCandles = Array.from(combinedDataMap.values()).sort(
      (a: CandlestickData, b: CandlestickData) => a.height - b.height,
    );

    return sortedCandles;
  };
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
  const startBlockHeight = getStartBlockHeight(
    blockInfo?.[0]?.height ?? null,
    ms.days(7) as number,
  );

  const limit = 10000;

  const { data: candles1 } = useOHLC(asset1.symbol, asset2.symbol, startBlockHeight, limit);
  const { data: candles2 } = useOHLC(asset2.symbol, asset1.symbol, startBlockHeight, limit);
  const mergeCandles = createMergeCandles(asset1, asset2);
  const candles = mergeCandles(candles1 ?? [], candles2 ?? []);

  const { data: blockTimestamps } = useBlockTimestamps(candles?.[0]?.height, last(candles)?.height);

  const timestampsByHeight = fromEntries(
    blockTimestamps?.map(block => [block.height, block.created_at]) || [],
  );

  const candlesWithTime = candles
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
