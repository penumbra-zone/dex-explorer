import { makeAutoObservable } from 'mobx';
import { pnum } from '@penumbra-zone/types/pnum';

export enum SellLimitOrderOptions {
  Market = 'Market',
  Plus2Percent = '+2%',
  Plus5Percent = '+5%',
  Plus10Percent = '+10%',
  Plus15Percent = '+15%',
}

export enum BuyLimitOrderOptions {
  Market = 'Market',
  Minus2Percent = '-2%',
  Minus5Percent = '-5%',
  Minus10Percent = '-10%',
  Minus15Percent = '-15%',
}

export const BuyLimitOrderMultipliers = {
  [BuyLimitOrderOptions.Market]: 1,
  [BuyLimitOrderOptions.Minus2Percent]: 0.98,
  [BuyLimitOrderOptions.Minus5Percent]: 0.95,
  [BuyLimitOrderOptions.Minus10Percent]: 0.9,
  [BuyLimitOrderOptions.Minus15Percent]: 0.85,
};

export const SellLimitOrderMultipliers = {
  [SellLimitOrderOptions.Market]: 1,
  [SellLimitOrderOptions.Plus2Percent]: 1.02,
  [SellLimitOrderOptions.Plus5Percent]: 1.05,
  [SellLimitOrderOptions.Plus10Percent]: 1.1,
  [SellLimitOrderOptions.Plus15Percent]: 1.15,
};

export class LimitOrder {
  priceInput?: string | number;
  exponent?: number;
  marketPrice?: number;

  constructor() {
    makeAutoObservable(this);
  }

  get price(): number {
    if (this.priceInput === undefined || this.priceInput === '') {
      return '';
    }
    return pnum(this.priceInput, this.exponent).toRoundedNumber();
  }

  setPrice = (price: string) => {
    this.priceInput = price;
  };

  setBuyLimitPriceOption = (option: BuyLimitOrderOptions) => {
    if (this.marketPrice) {
      this.priceInput = this.marketPrice * BuyLimitOrderMultipliers[option];
    }
  };

  setSellLimitPriceOption = (option: SellLimitOrderOptions) => {
    if (this.marketPrice) {
      this.priceInput = this.marketPrice * SellLimitOrderMultipliers[option];
    }
  };

  setMarketPrice = (price: number) => {
    this.marketPrice = price;
  };

  setExponent = (exponent: number) => {
    this.exponent = exponent;
  };
}
