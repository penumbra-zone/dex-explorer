import { makeAutoObservable } from 'mobx';
import { round } from '@/shared/utils/numbers/round';

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

export class RangeLiquidity {
  upperBound?: number;
  lowerBound?: number;
  feeTier?: number;
  positions?: number;
  marketPrice?: number;
  exponent?: number;

  constructor() {
    makeAutoObservable(this);
  }

  setUpperBound = (amount: string) => {
    const nextUpperBound = Number(amount);

    if (nextUpperBound > (this.lowerBound ?? 0)) {
      this.upperBound = Number(round(nextUpperBound, this.exponent ?? 0));
    }
  };

  setUpperBoundOption = (option: UpperBoundOptions) => {
    if (this.marketPrice) {
      this.upperBound = Number(
        round(this.marketPrice * UpperBoundMultipliers[option], this.exponent ?? 0),
      );
    }
  };

  setLowerBound = (amount: string) => {
    const nextLowerBound = Number(amount);

    if (nextLowerBound < (this.upperBound ?? 0)) {
      this.lowerBound = Number(round(nextLowerBound, this.exponent ?? 0));
    }
  };

  setLowerBoundOption = (option: LowerBoundOptions) => {
    if (this.marketPrice) {
      this.lowerBound = Number(
        round(this.marketPrice * LowerBoundMultipliers[option], this.exponent ?? 0),
      );
    }
  };

  setFeeTier = (feeTier: string) => {
    this.feeTier = Number(feeTier);
  };

  setFeeTierOption = (option: FeeTierOptions) => {
    this.feeTier = FeeTierValues[option];
  };

  setPositions = (positions: string) => {
    this.positions = Number(positions);
  };

  setMarketPrice = (price: number) => {
    this.marketPrice = price;
  };

  setExponent = (exponent: number) => {
    this.exponent = exponent;
  };
}
