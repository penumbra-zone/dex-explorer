import { AssetInfo } from '@/pages/trade/model/AssetInfo';
import { rangeLiquidityPositions } from '@/shared/math/position';
import { parseNumber } from '@/shared/utils/num';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { pnum } from '@penumbra-zone/types/pnum';
import { makeAutoObservable } from 'mobx';

const extractAmount = (positions: Position[], asset: AssetInfo): number => {
  let out = 0.0;
  for (const position of positions) {
    const asset1 = position.phi?.pair?.asset1;
    const asset2 = position.phi?.pair?.asset2;
    if (asset1?.equals(asset.id)) {
      out += pnum(position.reserves?.r1, asset.exponent).toNumber();
    }
    if (asset2?.equals(asset.id)) {
      out += pnum(position.reserves?.r2, asset.exponent).toNumber();
    }
  }
  return out;
};

export const MIN_POSITION_COUNT = 5;
export const MAX_POSITION_COUNT = 15;

export class RangeOrderFormStore {
  private _baseAsset?: AssetInfo;
  private _quoteAsset?: AssetInfo;
  liquidityTargetInput = '';
  upperPriceInput = '';
  lowerPriceInput = '';
  feeTierPercentInput = '';
  private _positionCountInput = '5';
  private _positionCountSlider = 5;
  marketPrice = 1;

  constructor() {
    makeAutoObservable(this);
  }

  get baseAsset(): undefined | AssetInfo {
    return this._baseAsset;
  }

  get quoteAsset(): undefined | AssetInfo {
    return this._quoteAsset;
  }

  get liquidityTarget(): number | undefined {
    return parseNumber(this.liquidityTargetInput);
  }

  get upperPrice(): number | undefined {
    return parseNumber(this.upperPriceInput);
  }

  get lowerPrice(): number | undefined {
    return parseNumber(this.lowerPriceInput);
  }

  // Treat fees that don't parse as 0
  get feeTierPercent(): number {
    return Math.max(0, Math.min(parseNumber(this.feeTierPercentInput) ?? 0, 50));
  }

  get positionCountInput(): string {
    return this._positionCountInput;
  }

  set positionCountInput(x: string) {
    this._positionCountInput = x;
    const count = this.positionCount;
    if (count !== undefined) {
      this._positionCountSlider = Math.max(MIN_POSITION_COUNT, Math.min(count, MAX_POSITION_COUNT));
    }
  }

  get positionCountSlider(): number {
    return this._positionCountSlider;
  }

  set positionCountSlider(x: number) {
    this._positionCountSlider = x;
    this._positionCountInput = x.toString();
  }

  get positionCount(): undefined | number {
    return parseNumber(this._positionCountInput);
  }

  get plan(): Position[] | undefined {
    if (
      !this._baseAsset ||
      !this._quoteAsset ||
      this.liquidityTarget === undefined ||
      this.upperPrice === undefined ||
      this.lowerPrice === undefined ||
      this.positionCount === undefined
    ) {
      return undefined;
    }
    return rangeLiquidityPositions({
      baseAsset: this._baseAsset,
      quoteAsset: this._quoteAsset,
      targetLiquidity: this.liquidityTarget,
      upperPrice: this.upperPrice,
      lowerPrice: this.lowerPrice,
      marketPrice: this.marketPrice,
      feeBps: this.feeTierPercent * 100,
      positions: this.positionCount,
    });
  }

  get baseAssetAmount(): string | undefined {
    const baseAsset = this._baseAsset;
    const plan = this.plan;
    if (!plan || !baseAsset) {
      return undefined;
    }
    return baseAsset.formatDisplayAmount(extractAmount(plan, baseAsset));
  }

  get quoteAssetAmount(): string | undefined {
    const quoteAsset = this._quoteAsset;
    const plan = this.plan;
    if (!plan || !quoteAsset) {
      return undefined;
    }
    return quoteAsset.formatDisplayAmount(extractAmount(plan, quoteAsset));
  }

  assetChange(base: AssetInfo, quote: AssetInfo) {
    this._baseAsset = base;
    this._quoteAsset = quote;
    this.liquidityTargetInput = '';
    this.upperPriceInput = '';
    this.lowerPriceInput = '';
    this.feeTierPercentInput = '';
    this._positionCountInput = '5';
    this._positionCountSlider = 5;
  }
}
