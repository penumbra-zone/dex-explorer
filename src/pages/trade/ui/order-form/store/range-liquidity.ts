import { makeAutoObservable } from 'mobx';
import { pnum } from '@penumbra-zone/types/pnum';
import {
  Position,
  PositionState,
  PositionState_PositionStateEnum,
  TradingPair,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { TransactionPlannerRequest } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { OrderFormAsset } from './asset';
import BigNumber from 'bignumber.js';
import { plan } from '../helpers';
import { rangeLiquidityPositions } from '@/shared/math/position';

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
      !this.baseAsset.assetId ||
      !this.quoteAsset ||
      !this.quoteAsset.assetId ||
      !this.baseAsset.exponent ||
      !this.quoteAsset.exponent ||
      !this.marketPrice
    ) {
      return [];
    }

    const positions = rangeLiquidityPositions({
      baseAsset: {
        id: this.baseAsset.assetId,
        exponent: this.baseAsset.exponent,
      },
      quoteAsset: {
        id: this.quoteAsset.assetId,
        exponent: this.quoteAsset.exponent,
      },
      targetLiquidity: Number(this.target),
      upperPrice: Number(this.upperBound),
      lowerPrice: Number(this.lowerBound),
      marketPrice: this.marketPrice,
      feeBps: (this.feeTier ?? 0.1) * 100,
      positions: this.positions,
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
      pnum(baseAmount, this.baseAsset?.exponent).toRoundedNumber(),
    );
    console.log(
      'TCL: total quoteAmount',
      pnum(quoteAmount, this.quoteAsset?.exponent).toRoundedNumber(),
    );

    this.baseAsset?.setAmount(pnum(baseAmount, this.baseAsset.exponent).toRoundedNumber());
    this.quoteAsset?.setAmount(pnum(quoteAmount, this.quoteAsset.exponent).toRoundedNumber());

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
