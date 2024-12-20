import React from 'react';
import { useMarketPrice } from '../model/useMarketPrice';
import { Asset } from '@/shared/math/position';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { LoadingCell } from './market-trades';
import { pnum } from '@penumbra-zone/types/pnum';

export const PositionsCurrentValue = ({
  baseAsset,
  quoteAsset,
}: {
  baseAsset: Asset;
  quoteAsset: Asset;
}) => {
  const marketPrice = useMarketPrice(baseAsset.symbol, quoteAsset.symbol);

  return marketPrice ? (
    <ValueViewComponent
      valueView={pnum(marketPrice, quoteAsset.exponent).toValueView(quoteAsset.asset)}
      density='slim'
    />
  ) : (
    <LoadingCell />
  );
};
