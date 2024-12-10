import { makeAutoObservable } from 'mobx';
import { pnum } from '@penumbra-zone/types/pnum';
import {
  Position,
  PositionOpen,
  PositionState,
  PositionState_PositionStateEnum,
  TradingPair,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { TransactionPlannerRequest } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { OrderFormAsset } from './asset';
import BigNumber from 'bignumber.js';
import { plan } from '../helpers';
import { ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

window.BigNumber = BigNumber;

export enum UpperBoundOptions {
  Market = 'Market',
  Plus2Percent = '+2%',
  Plus5Percent = '+5%',
  Plus10Percent = '+10%',
  Plus15Percent = '+15%',
}

export enum LowerBoundOptions {
  Market = 'Market',
  Minus2Percent = '-2%',
  Minus5Percent = '-5%',
  Minus10Percent = '-10%',
  Minus15Percent = '-15%',
}

export enum FeeTierOptions {
  '0.1%' = '0.1%',
  '0.25%' = '0.25%',
  '0.5%' = '0.5%',
  '1.00%' = '1.00%',
}

const UpperBoundMultipliers = {
  [UpperBoundOptions.Market]: 1,
  [UpperBoundOptions.Plus2Percent]: 1.02,
  [UpperBoundOptions.Plus5Percent]: 1.05,
  [UpperBoundOptions.Plus10Percent]: 1.1,
  [UpperBoundOptions.Plus15Percent]: 1.15,
};

const LowerBoundMultipliers = {
  [LowerBoundOptions.Market]: 1,
  [LowerBoundOptions.Minus2Percent]: 0.98,
  [LowerBoundOptions.Minus5Percent]: 0.95,
  [LowerBoundOptions.Minus10Percent]: 0.9,
  [LowerBoundOptions.Minus15Percent]: 0.85,
};

const FeeTierValues: Record<FeeTierOptions, number> = {
  '0.1%': 0.1,
  '0.25%': 0.25,
  '0.5%': 0.5,
  '1.00%': 1,
};

export const DEFAULT_POSITIONS = 10;
export const MIN_POSITIONS = 5;
export const MAX_POSITIONS = 15;

export class RangeLiquidity {
  target?: number | string = '';
  upperBoundInput?: string | number;
  lowerBoundInput?: string | number;
  positionsInput?: string | number;
  feeTier?: number;
  marketPrice?: number;
  baseAsset?: OrderFormAsset;
  quoteAsset?: OrderFormAsset;
  gasFee?: number;
  onFieldChangeCallback?: () => Promise<void>;

  constructor() {
    makeAutoObservable(this);

    this.onFieldChangeCallback = this.calculateFeesAndAmounts;
  }

  get upperBound(): string | number {
    if (this.upperBoundInput === undefined || this.upperBoundInput === '' || !this.quoteAsset) {
      return '';
    }
    return pnum(this.upperBoundInput, this.quoteAsset.exponent).toRoundedNumber();
  }

  get lowerBound(): string | number {
    if (this.lowerBoundInput === undefined || this.lowerBoundInput === '' || !this.quoteAsset) {
      return '';
    }
    return pnum(this.lowerBoundInput, this.quoteAsset.exponent).toRoundedNumber();
  }

  get positions(): number | undefined {
    return this.positionsInput === ''
      ? undefined
      : Math.max(
          MIN_POSITIONS,
          Math.min(MAX_POSITIONS, Number(this.positionsInput ?? DEFAULT_POSITIONS)),
        );
  }

  // logic from: /penumbra/core/crates/bin/pcli/src/command/tx/replicate/linear.rs
  buildPositions = (): Position[] => {
    if (
      !this.positions ||
      !this.target ||
      !this.baseAsset ||
      !this.quoteAsset ||
      !this.baseAsset.exponent ||
      !this.quoteAsset.exponent ||
      !this.marketPrice
    ) {
      return [];
    }

    // The step width is positions-1 because it's between the endpoints
    // |---|---|---|---|
    // 0   1   2   3   4
    //   0   1   2   3
    const stepWidth = (Number(this.upperBound) - Number(this.lowerBound)) / (this.positions - 1);

    // We are treating quote asset as the numeraire and want to have an even spread
    // of quote asset value across all positions.
    // const targetInput = pnum(this.target, this.quoteAsset.exponent).toBigInt();
    const quoteAssetAmountPerPosition = Number(this.target) / this.positions;
    // const quoteAssetAmountPerPosition = targetInput / BigInt(this.positions);

    const baseAssetExponentUnits = BigInt(10) ** BigInt(this.baseAsset.exponent);
    const quoteAssetExponentUnits = BigInt(10) ** BigInt(this.quoteAsset.exponent);

    const positions = Array.from({ length: this.positions }, (_, i) => {
      const positionPrice = Number(this.lowerBound) + stepWidth * i;

      // Cross-multiply exponents and prices for trading function coefficients
      //
      // We want to write
      // p = EndUnit * price
      // q = StartUnit
      // However, if EndUnit is too small, it might not round correctly after multiplying by price
      // To handle this, conditionally apply a scaling factor if the EndUnit amount is too small.
      const scale = quoteAssetExponentUnits < 1_000_000n ? 1_000_000n : 1n;

      const p = pnum(
        BigInt(
          BigNumber((quoteAssetExponentUnits * scale).toString())
            .times(BigNumber(positionPrice))
            .shiftedBy(-(this.quoteAsset.exponent - this.baseAsset.exponent))
            .toFixed(0),
        ),
        this.quoteAsset?.exponent,
      ).toAmount();

      const q = pnum(baseAssetExponentUnits * scale, this.baseAsset?.exponent).toAmount();

      console.log(
        'TCL: RangeLiquidity -> quoteAssetAmountPerPosition',
        quoteAssetAmountPerPosition,
      );

      // Compute reserves
      const reserves =
        positionPrice < this.marketPrice
          ? // If the position's price is _less_ than the current price, fund it with asset 2
            // so the position isn't immediately arbitraged.
            {
              r1: pnum(0n).toAmount(),
              r2: pnum(quoteAssetAmountPerPosition).toAmount(),
              // r2: pnum(quoteAssetAmountPerPosition, this.quoteAsset.exponent).toAmount(),
            }
          : {
              // If the position's price is _greater_ than the current price, fund it with
              // an equivalent amount of asset 1 as the target per-position amount of asset 2.
              // r1: pnum(
              //   quoteAssetAmountPerPosition / positionPrice,
              //   this.baseAsset?.exponent,
              // ).toAmount(),
              r1: pnum(
                BigInt(
                  BigNumber(quoteAssetAmountPerPosition.toString()).div(positionPrice).toFixed(0),
                ),
              ).toAmount(),
              r2: pnum(0n).toAmount(),
            };

      const fee = (this.feeTier ?? 0.1) * 100;

      return new Position({
        phi: {
          component: { fee, p, q },
          pair: new TradingPair({
            asset1: this.baseAsset?.assetId,
            asset2: this.quoteAsset?.assetId,
          }),
        },
        nonce: crypto.getRandomValues(new Uint8Array(32)),
        state: new PositionState({ state: PositionState_PositionStateEnum.OPENED }),
        reserves,
        closeOnFill: false,
      });
    });

    return positions;
  };

  calculateFeesAndAmounts = async (): Promise<void> => {
    const positions = this.buildPositions();

    if (!positions.length) {
      return;
    }

    // const baseAssetExponentUnits = BigInt(10) ** BigInt(this.baseAsset.exponent);
    // const quoteAssetExponentUnits = BigInt(10) ** BigInt(this.quoteAsset.exponent);

    console.table({
      baseAsset: this.baseAsset?.symbol,
      quoteAsset: this.quoteAsset?.symbol,
      baseAssetExponent: this.baseAsset?.exponent,
      quoteAssetExponent: this.quoteAsset?.exponent,
      positions: this.positions,
      target: this.target,
      upperBound: this.upperBound,
      lowerBound: this.lowerBound,
      feeTier: this.feeTier,
    });

    console.table(
      positions.map(position => ({
        p: pnum(position.phi?.component?.p).toBigInt(),
        q: pnum(position.phi?.component?.q).toBigInt(),
        r1: pnum(position.reserves?.r1).toBigInt(),
        r2: pnum(position.reserves?.r2).toBigInt(),
      })),
    );

    const { baseAmount, quoteAmount } = positions.reduce(
      (amounts, position: Position) => {
        return {
          baseAmount: amounts.baseAmount + pnum(position.reserves?.r1).toBigInt(),
          quoteAmount: amounts.quoteAmount + pnum(position.reserves?.r2).toBigInt(),
        };
      },
      { baseAmount: 0n, quoteAmount: 0n },
    );

    console.log(
      'TCL: total baseAmount',
      baseAmount,
      pnum(baseAmount, this.baseAsset.exponent).toRoundedNumber(),
    );

    console.log(
      'TCL: total quoteAmount',
      quoteAmount,
      pnum(quoteAmount, this.quoteAsset.exponent).toRoundedNumber(),
    );

    this.baseAsset?.setAmount(Number(baseAmount));
    this.quoteAsset?.setAmount(Number(quoteAmount));
    // this.baseAsset?.setAmount(pnum(baseAmount, this.baseAsset.exponent).toRoundedNumber());
    // this.quoteAsset?.setAmount(pnum(quoteAmount, this.quoteAsset.exponent).toRoundedNumber());

    const positionsReq = new TransactionPlannerRequest({
      positionOpens: positions.map(position => ({ position })),
      source: this.quoteAsset?.accountIndex,
    });

    const txPlan = await plan(positionsReq);
    const fee = txPlan.transactionParameters?.fee;

    this.gasFee = pnum(fee?.amount, this.baseAsset?.exponent).toRoundedNumber();
  };

  setTarget = (target: string | number): void => {
    this.target = target;
    if (this.onFieldChangeCallback) {
      void this.onFieldChangeCallback();
    }
  };

  setUpperBound = (amount: string) => {
    this.upperBoundInput = amount;
    if (this.onFieldChangeCallback) {
      void this.onFieldChangeCallback();
    }
  };

  setUpperBoundOption = (option: UpperBoundOptions) => {
    if (this.marketPrice) {
      this.upperBoundInput = this.marketPrice * UpperBoundMultipliers[option];
      if (this.onFieldChangeCallback) {
        void this.onFieldChangeCallback();
      }
    }
  };

  setLowerBound = (amount: string) => {
    this.lowerBoundInput = amount;
    if (this.onFieldChangeCallback) {
      void this.onFieldChangeCallback();
    }
  };

  setLowerBoundOption = (option: LowerBoundOptions) => {
    if (this.marketPrice) {
      this.lowerBoundInput = this.marketPrice * LowerBoundMultipliers[option];
      if (this.onFieldChangeCallback) {
        void this.onFieldChangeCallback();
      }
    }
  };

  setFeeTier = (feeTier: string) => {
    this.feeTier = Number(feeTier);
    if (this.onFieldChangeCallback) {
      void this.onFieldChangeCallback();
    }
  };

  setFeeTierOption = (option: FeeTierOptions) => {
    this.feeTier = FeeTierValues[option];
    if (this.onFieldChangeCallback) {
      void this.onFieldChangeCallback();
    }
  };

  setPositions = (positions: number | string) => {
    this.positionsInput = positions;
    if (this.onFieldChangeCallback) {
      void this.onFieldChangeCallback();
    }
  };

  setMarketPrice = (price: number) => {
    this.marketPrice = price;
  };

  setAssets = (baseAsset: OrderFormAsset, quoteAsset: OrderFormAsset): void => {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
  };

  // onFieldChange = (callback: () => Promise<void>): void => {
  //   this.onFieldChangeCallback = callback;
  // };
}
