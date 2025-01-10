import {
  BareTradingFunction,
  Position,
  PositionId,
  PositionState_PositionStateEnum,
  Reserves,
  TradingFunction,
  TradingPair,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { isZero } from '@penumbra-zone/types/amount';
import { pnum } from '@penumbra-zone/types/pnum';

export interface ProcessedAsset {
  asset: Metadata;
  exponent: number;
  amount: number;
  price: number;
  effectivePrice: number;
  reserves: Amount;
}

class ProcessedPosition extends Position {
  public position: Position;
  public baseAsset: Metadata | undefined;
  public quoteAsset: Metadata | undefined;
  public asset1Exponent: number;
  public asset2Exponent: number;
  public orders: Order[];
  constructor(
    position: Position,
    asset1Exponent: number,
    asset2Exponent: number,
    options?: { baseAsset: Metadata; quoteAsset: Metadata },
  ) {
    super(position);

    this.position = position;
    this.asset1Exponent = asset1Exponent;
    this.asset2Exponent = asset2Exponent;

    this.baseAsset = options?.baseAsset;
    this.quoteAsset = options?.quoteAsset;

    this.orders = this.getOrders();
  }

  private getOrdersByBaseQuoteAssets = (baseAsset: ProcessedAsset, quoteAsset: ProcessedAsset) => {
    if (!isZero(baseAsset.reserves) && !isZero(quoteAsset.reserves)) {
      return [
        {
          direction: 'Buy',
          baseAsset,
          quoteAsset,
        },
        {
          direction: 'Sell',
          baseAsset: quoteAsset,
          quoteAsset: baseAsset,
        },
      ];
    }

    if (!isZero(baseAsset.reserves) && isZero(quoteAsset.reserves)) {
      return [
        {
          direction: 'Sell',
          baseAsset,
          quoteAsset,
        },
      ];
    }

    if (isZero(baseAsset.reserves) && !isZero(quoteAsset.reserves)) {
      return [
        {
          direction: 'Buy',
          baseAsset,
          quoteAsset,
        },
      ];
    }

    return [
      {
        direction: '',
        baseAsset,
        quoteAsset,
      },
      {
        direction: '',
        baseAsset: quoteAsset,
        quoteAsset: baseAsset,
      },
    ];
  };

  private getDirectionalOrders = ({
    asset1,
    asset2,
  }: {
    asset1: {
      asset: Metadata;
      exponent: number;
      amount: number;
      price: number;
      effectivePrice: number;
      reserves: Amount;
    };
    asset2: {
      asset: Metadata;
      exponent: number;
      amount: number;
      price: number;
      effectivePrice: number;
      reserves: Amount;
    };
  }) => {
    if (!asset1.asset.penumbraAssetId || !asset2.asset.penumbraAssetId) {
      throw new Error('No current pair or assets');
    }

    const asset1IsBaseAsset = asset1.asset.penumbraAssetId.equals(this.baseAsset?.penumbraAssetId);
    const asset1IsQuoteAsset = asset1.asset.penumbraAssetId.equals(
      this.quoteAsset?.penumbraAssetId,
    );
    const asset2IsBaseAsset = asset2.asset.penumbraAssetId.equals(this.baseAsset?.penumbraAssetId);
    const asset2IsQuoteAsset = asset2.asset.penumbraAssetId.equals(
      this.quoteAsset?.penumbraAssetId,
    );

    // - if position in current pair, use the current orientation
    if (asset1IsBaseAsset && asset2IsQuoteAsset) {
      return this.getOrdersByBaseQuoteAssets(asset1, asset2);
    }

    if (asset1IsQuoteAsset && asset2IsBaseAsset) {
      return this.getOrdersByBaseQuoteAssets(asset2, asset1);
    }

    // - if position not in current pair, and one asset in position
    //   pair is the current view’s quote asset, use that asset as
    //   the quote asset
    if (asset1IsQuoteAsset) {
      return this.getOrdersByBaseQuoteAssets(asset2, asset1);
    }

    if (asset2IsQuoteAsset) {
      return this.getOrdersByBaseQuoteAssets(asset1, asset2);
    }

    // - otherwise use whatever ordering
    return this.getOrdersByBaseQuoteAssets(asset1, asset2);
  };

  private getOrders = () => {
    /* eslint-disable-next-line curly -- for conciseness */
    const { phi = {} as TradingFunction, reserves = {} as Reserves, state } = this.position;
    const { pair = {} as TradingPair, component = {} as BareTradingFunction } = phi;

    const { p, q } = component;
    const { r1, r2 } = reserves;

    const asset1Price = pnum(q).toBigNumber().dividedBy(pnum(p).toBigNumber()).toNumber();
    const asset2Price = pnum(p).toBigNumber().dividedBy(pnum(q).toBigNumber()).toNumber();

    const gamma = (10_000 - component.fee) / 10_000;
    const asset1EffectivePrice = pnum(q)
      .toBigNumber()
      .times(pnum(gamma).toBigNumber())
      .dividedBy(pnum(p).toBigNumber())
      .toNumber();

    const asset2EffectivePrice = pnum(p)
      .toBigNumber()
      .dividedBy(pnum(q).toBigNumber().times(pnum(gamma).toBigNumber()))
      .toNumber();

    const asset1Amount = pnum(asset2Price * pnum(r1, asset1Exponent).toNumber(), asset1Exponent);
    const asset2Amount = pnum(asset1Price * pnum(r2, asset2Exponent).toNumber(), asset2Exponent);

    const orders = this.getDirectionalOrders({
      asset1: {
        asset: asset1,
        exponent: asset1Exponent,
        amount: asset1Amount,
        price: asset1Price,
        effectivePrice: asset1EffectivePrice,
        reserves: reserves.r1,
      },
      asset2: {
        asset: asset2,
        exponent: asset2Exponent,
        amount: asset2Amount,
        price: asset2Price,
        effectivePrice: asset2EffectivePrice,
        reserves: reserves.r2,
      },
    });

    return orders;
  };
}

export { ProcessedPosition };
