import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import {
  Position,
  PositionState,
  PositionState_PositionStateEnum,
  TradingPair,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { pnum } from '@penumbra-zone/types/pnum';
import BigNumber from 'bignumber.js';

// This should be set so that we can still represent prices as numbers even multiplied by 10 ** this.
//
// For example, if this is set to 6, we should be able to represent PRICE * 10**6 as a number.
// In the year 202X, when 1 BTC = 1 million USD, then this is still only 1e12 < 2^50.
const PRECISION_DECIMALS = 12;

export interface Asset {
  id: AssetId;
  exponent: number;
}

export interface PositionPlan {
  baseAsset: Asset;
  quoteAsset: Asset;
  price: number;
  feeBps: number;
  baseReserves: number;
  quoteReserves: number;
}

const priceToPQ = (
  price: number,
  pExponent: number,
  qExponent: number,
): { p: number; q: number } => {
  // e.g. price     = X USD / UM
  //      basePrice = Y uUM / uUSD = X USD / UM * uUSD / USD * UM / uUM
  //                = X * 10 ** qExponent * 10 ** -pExponent
  const basePrice = new BigNumber(price).times(new BigNumber(10).pow(qExponent - pExponent));
  // USD / UM -> [USD, UM], with a given precision
  const [q, p] = basePrice.toFraction(10 ** PRECISION_DECIMALS);
  return { p: p.toNumber(), q: q.toNumber() };
};

export const planToPosition = (plan: PositionPlan): Position => {
  const { p, q } = priceToPQ(plan.price, plan.baseAsset.exponent, plan.quoteAsset.exponent);

  const r1 = pnum(plan.baseReserves, plan.baseAsset.exponent).toAmount();
  const r2 = pnum(plan.quoteReserves, plan.quoteAsset.exponent).toAmount();

  return new Position({
    phi: {
      component: {
        fee: plan.feeBps,
        p: pnum(p).toAmount(),
        q: pnum(q).toAmount(),
      },
      pair: new TradingPair({
        asset1: plan.baseAsset.id,
        asset2: plan.quoteAsset.id,
      }),
    },
    nonce: crypto.getRandomValues(new Uint8Array(32)),
    state: new PositionState({ state: PositionState_PositionStateEnum.OPENED }),
    reserves: { r1, r2 },
    closeOnFill: false,
  });
};

interface RangeLiquidityPlan {
  baseAsset: Asset;
  quoteAsset: Asset;
  targetLiquidity: number;
  upperPrice: number;
  lowerPrice: number;
  marketPrice: number;
  feeBps: number;
  positions: number;
}

export const rangeLiquidityPositions = (plan: RangeLiquidityPlan): Position[] => {
  // The step width is positions-1 because it's between the endpoints
  // |---|---|---|---|
  // 0   1   2   3   4
  //   0   1   2   3
  const stepWidth = (plan.upperPrice - plan.lowerPrice) / plan.positions;
  return Array.from({ length: plan.positions }, (_, i) => {
    const price = plan.lowerPrice + i * stepWidth;

    let baseReserves: number;
    let quoteReserves: number;
    if (price < plan.marketPrice) {
      // If the price is < market price, then people *paying* that price are getting a good deal,
      // and receiving the base asset in exchange, so we don't want to offer them any of that.
      baseReserves = 0;
      quoteReserves = plan.targetLiquidity / plan.positions;
    } else {
      // Conversely, when price > market price, then the people that are selling the base asset,
      // receiving the quote asset in exchange are getting a good deal, so we don't want to offer that.
      baseReserves = plan.targetLiquidity / plan.positions / price;
      quoteReserves = 0;
    }

    return planToPosition({
      baseAsset: plan.baseAsset,
      quoteAsset: plan.quoteAsset,
      feeBps: plan.feeBps,
      price,
      baseReserves,
      quoteReserves,
    });
  });
};

interface LimitOrderPlan {
  buy: 'buy' | 'sell';
  price: number;
  input: number;
  baseAsset: Asset;
  quoteAsset: Asset;
}

export const limitOrderPosition = (plan: LimitOrderPlan): Position => {
  let baseReserves: number;
  let quoteReserves: number;
  if (plan.buy === 'buy') {
    baseReserves = 0;
    quoteReserves = plan.input;
  } else {
    baseReserves = plan.input;
    quoteReserves = 0;
  }
  const pos = planToPosition({
    baseAsset: plan.baseAsset,
    quoteAsset: plan.quoteAsset,
    feeBps: 0,
    price: plan.price,
    baseReserves,
    quoteReserves,
  });
  pos.closeOnFill = true;
  return pos;
};
