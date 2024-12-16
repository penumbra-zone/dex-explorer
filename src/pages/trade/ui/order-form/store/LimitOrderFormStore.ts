import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { PriceLinkedInputs } from './PriceLinkedInputs';
import { limitOrderPosition } from '@/shared/math/position';
import { makeAutoObservable, reaction } from 'mobx';
import { AssetInfo } from '@/pages/trade/model/AssetInfo';
import { parseNumber } from '@/shared/utils/num';

export type BuySell = 'buy' | 'sell';

export const BUY_PRICE_OPTIONS: Record<string, (mp: number) => number> = {
  Market: (mp: number) => mp,
  '-2%': mp => 0.98 * mp,
  '-5%': mp => 0.95 * mp,
  '-10%': mp => 0.9 * mp,
  '-15%': mp => 0.85 * mp,
};

export const SELL_PRICE_OPTIONS: Record<string, (mp: number) => number> = {
  Market: (mp: number) => mp,
  '+2%': mp => 1.02 * mp,
  '+5%': mp => 1.05 * mp,
  '+10%': mp => 1.1 * mp,
  '+15%': mp => 1.15 * mp,
};

export class LimitOrderFormStore {
  private _baseAsset?: AssetInfo;
  private _quoteAsset?: AssetInfo;
  private _input = new PriceLinkedInputs();
  buySell: BuySell = 'buy';
  marketPrice = 1.0;
  private _priceInput = '';

  constructor() {
    makeAutoObservable(this);

    reaction(() => [this.buySell], this._resetInputs);
  }

  private _resetInputs = () => {
    this._input.inputA = '';
    this._input.inputB = '';
    this._priceInput = '';
  };

  setBuySell = (x: BuySell) => {
    this.buySell = x;
  };

  get baseAsset(): undefined | AssetInfo {
    return this._baseAsset;
  }

  get quoteAsset(): undefined | AssetInfo {
    return this._quoteAsset;
  }

  get baseInput(): string {
    return this._input.inputA;
  }

  setBaseInput = (x: string) => {
    this._input.inputA = x;
  };

  get quoteInput(): string {
    return this._input.inputB;
  }

  setQuoteInput = (x: string) => {
    this._input.inputB = x;
  };

  get priceInput(): string {
    return this._priceInput;
  }

  setPriceInput = (x: string) => {
    this._priceInput = x;
    const price = this.price;
    if (price !== undefined) {
      this._input.price = price;
    }
  };

  setPriceInputFromOption = (x: string) => {
    const price = (BUY_PRICE_OPTIONS[x] ?? (x => x))(this.marketPrice);
    this.setPriceInput(price.toString());
  };

  get price(): number | undefined {
    return parseNumber(this._priceInput);
  }

  get plan(): Position | undefined {
    const input =
      this.buySell === 'buy' ? parseNumber(this.quoteInput) : parseNumber(this.baseInput);
    if (!input || !this._baseAsset || !this._quoteAsset || !this.price) {
      return undefined;
    }
    return limitOrderPosition({
      buy: this.buySell,
      price: this.price,
      input,
      baseAsset: this._baseAsset,
      quoteAsset: this._quoteAsset,
    });
  }

  setAssets(base: AssetInfo, quote: AssetInfo, resetInputs = false) {
    this._baseAsset = base;
    this._quoteAsset = quote;
    if (resetInputs) {
      this._input.inputA = '';
      this._input.inputB = '';
      this._priceInput = '';
    }
  }
}
