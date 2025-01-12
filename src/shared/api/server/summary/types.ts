import { DurationWindow } from '@/shared/utils/duration.ts';
import { Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { DexExPairsSummary } from '@/shared/database/schema';
import { calculateDisplayPrice } from '@/shared/utils/price-conversion';
import { round } from '@penumbra-zone/types/round';
import { toValueView } from '@/shared/utils/value-view';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';

const priceDiffLabel = (num: number): ChangeData['sign'] => {
  if (num === 0) {
    return 'neutral';
  }
  if (num > 0) {
    return 'positive';
  }
  return 'negative';
};

export interface ChangeData {
  sign: 'positive' | 'negative' | 'neutral';
  value: number;
  percent: string;
}

export interface SummaryData {
  baseAsset: Metadata;
  quoteAsset: Metadata;
  liquidity: ValueView;
  window: DurationWindow;
  directVolume: ValueView;
  price: number;
  high: number;
  low: number;
  change: ChangeData;
  candles?: number[];
  candleTimes?: Date[];
}

export const adaptSummary = (
  summary: DexExPairsSummary,
  baseAsset: Metadata,
  quoteAsset: Metadata,
  usdc: Metadata | undefined,
  candles?: number[],
  candleTimes?: Date[],
): SummaryData => {
  let liquidity = toValueView({
    amount: Math.floor(summary.liquidity),
    metadata: quoteAsset,
  });

  let directVolume = toValueView({
    amount: Math.floor(summary.direct_volume_over_window),
    metadata: quoteAsset,
  });

  if (summary.usdc_price) {
    const expDiffLiquidity = Math.abs(
      getDisplayDenomExponent(quoteAsset) - getDisplayDenomExponent(usdc),
    );
    const resultLiquidity = summary.liquidity * summary.usdc_price * 10 ** expDiffLiquidity;
    liquidity = toValueView({
      amount: Math.floor(resultLiquidity),
      metadata: quoteAsset,
    });

    const expDiffDirectVolume = Math.abs(
      getDisplayDenomExponent(quoteAsset) - getDisplayDenomExponent(usdc),
    );
    const resultDirectVolume =
      summary.direct_volume_over_window * summary.usdc_price * 10 ** expDiffDirectVolume;
    directVolume = toValueView({
      amount: Math.floor(resultDirectVolume),
      metadata: quoteAsset,
    });
  }

  const priceDiff = summary.price - summary.price_then;
  const change = {
    value: calculateDisplayPrice(priceDiff, baseAsset, quoteAsset),
    sign: priceDiffLabel(priceDiff),
    percent:
      summary.price === 0
        ? '0'
        : round({
            value: Math.abs(((summary.price - summary.price_then) / summary.price_then) * 100),
            decimals: 2,
          }),
  };

  return {
    window: summary.the_window,
    price: calculateDisplayPrice(summary.price, baseAsset, quoteAsset),
    high: calculateDisplayPrice(summary.high, baseAsset, quoteAsset),
    low: calculateDisplayPrice(summary.low, baseAsset, quoteAsset),
    baseAsset,
    quoteAsset,
    change,
    liquidity,
    directVolume,
    candles,
    candleTimes,
  };
};

export interface NoSummaryData {
  window: DurationWindow;
  noData: true;
}

export type SummaryResponse = SummaryData | NoSummaryData | { error: string };
