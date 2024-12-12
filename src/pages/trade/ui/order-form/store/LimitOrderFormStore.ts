import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { PriceLinkedInputs } from './PriceLinkedInputs';
import { limitOrderPosition } from '@/shared/math/position';
import { makeAutoObservable } from 'mobx';
import { AssetInfo } from '@/pages/trade/model/AssetInfo';
import { parseNumber } from '@/shared/utils/num';

export type BuySell = 'buy' | 'sell';

export class LimitOrderFormStore {
  private _baseAsset?: AssetInfo;
  private _quoteAsset?: AssetInfo;
  private _input = new PriceLinkedInputs();
  buySell: BuySell = 'buy';
  marketPrice = 1.0;
  private _priceInput: string = '';

  constructor() {
    makeAutoObservable(this);
  }

  get baseAsset(): undefined | AssetInfo {
    return this._baseAsset;
  }

  get quoteAsset(): undefined | AssetInfo {
    return this._quoteAsset;
  }

  get baseInput(): string {
    return this._input.inputA;
  }

  get quoteInput(): string {
    return this._input.inputB;
  }

  get priceInput(): string {
    return this._priceInput;
  }

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

  assetChange(base: AssetInfo, quote: AssetInfo) {
    this._baseAsset = base;
    this._quoteAsset = quote;
    this._input.inputA = '';
    this._input.inputB = '';
    this._priceInput = '';
  }

  set baseInput(x: string) {
    this._input.inputA = x;
  }

  set quoteInput(x: string) {
    this._input.inputB = x;
  }

  set priceInput(x: string) {
    this._priceInput = x;
    const price = this.price;
    if (price !== undefined) {
      this._input.price = price;
    }
  }
}
