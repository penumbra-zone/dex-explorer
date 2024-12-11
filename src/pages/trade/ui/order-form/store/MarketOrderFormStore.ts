import { makeAutoObservable, reaction } from 'mobx';
import { AssetId, Value } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { pnum } from '@penumbra-zone/types/pnum';
import debounce from 'lodash/debounce';
import { parseNumber } from '@/shared/utils/num';
import { penumbra } from '@/shared/const/penumbra';
import { SimulationService } from '@penumbra-zone/protobuf';
import { SimulateTradeRequest } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { openToast } from '@penumbra-zone/ui/Toast';

class AssetInfo {
  constructor(
    public id: AssetId,
    public balance: number,
    public exponent: number,
    public symbol: string,
  ) {}

  value(display: number): Value {
    return new Value({
      amount: pnum(display, this.exponent).toAmount(),
      assetId: this.id,
    });
  }

  formatDisplayAmount(amount: number): string {
    const amountString = pnum(amount, this.exponent).toFormattedString({
      commas: true,
      decimals: 4,
      trailingZeros: false,
    });
    return `${amountString} ${this.symbol}`;
  }
}

const estimateAmount = async (
  from: AssetInfo,
  to: AssetInfo,
  input: number,
): Promise<number | undefined> => {
  try {
    const req = new SimulateTradeRequest({
      input: from.value(input),
      output: to.id,
    });

    const res = await penumbra.service(SimulationService).simulateTrade(req);

    const amount = res.output?.output?.amount;
    if (amount === undefined) {
      throw new Error('Amount returned from swap simulation was undefined');
    }
    return pnum(amount, to.exponent).toNumber();
  } catch (e) {
    if (
      e instanceof Error &&
      ![
        'ConnectError',
        'PenumbraNotInstalledError',
        'PenumbraProviderNotAvailableError',
        'PenumbraProviderNotConnectedError',
      ].includes(e.name)
    ) {
      openToast({
        type: 'error',
        message: e.name,
        description: e.message,
      });
    }
    return undefined;
  }
};

export type BuySell = 'Buy' | 'Sell';

export type LastEdited = 'Base' | 'Quote';

// When we need to use an estimate call, avoid triggering it for this many milliseconds
// to avoid jitter as the user types.
const ESTIMATE_DEBOUNCE_MS = 200;

export interface MarketOrderPlan {
  targetAsset: AssetId;
  value: Value;
}

export class MarketOrderFormStore {
  private _baseAsset?: AssetInfo;
  private _quoteAsset?: AssetInfo;
  private _baseAssetInput: string = '';
  private _quoteAssetInput: string = '';
  private _baseEstimating: boolean = false;
  private _quoteEstimating: boolean = false;
  private _buySell: BuySell = 'Buy';
  private _lastEdited: LastEdited = 'Base';

  constructor() {
    makeAutoObservable(this);

    reaction(
      () => [this._baseAssetInput, this._quoteAssetInput, this._baseAsset, this._quoteAsset],
      debounce(async () => {
        if (!this._baseAsset || !this._quoteAsset) {
          return;
        }
        if (this._lastEdited === 'Base') {
          const input = this.baseInputAmount;
          if (input === undefined) {
            return;
          }
          this._quoteEstimating = true;
          try {
            const res = await estimateAmount(this._quoteAsset, this._baseAsset, input);
            if (res === undefined) {
              return;
            }
            this._quoteAssetInput = res.toString();
          } finally {
            this._quoteEstimating = false;
          }
        } else {
          const input = this.quoteInputAmount;
          if (input === undefined) {
            return;
          }
          this._baseEstimating = true;
          try {
            const res = await estimateAmount(this._baseAsset, this._quoteAsset, input);
            if (res === undefined) {
              return;
            }
            this._baseAssetInput = res.toString();
          } finally {
            this._baseEstimating = false;
          }
        }
      }, ESTIMATE_DEBOUNCE_MS),
    );
  }

  get baseInput(): string {
    return this._baseAssetInput;
  }

  get quoteInput(): string {
    return this._quoteAssetInput;
  }

  set baseInput(x: string) {
    this._lastEdited = 'Base';
    this._baseAssetInput = x;
  }

  set quoteInput(x: string) {
    this._lastEdited = 'Quote';
    this._quoteAssetInput = x;
  }

  get baseInputAmount(): undefined | number {
    return parseNumber(this._baseAssetInput);
  }

  get quoteInputAmount(): undefined | number {
    return parseNumber(this._quoteAssetInput);
  }

  get baseEstimating(): boolean {
    return this._baseEstimating;
  }

  get quoteEstimating(): boolean {
    return this._quoteEstimating;
  }

  get balance(): undefined | string {
    if (this._buySell === 'Buy') {
      if (!this._quoteAsset) {
        return undefined;
      }
      return this._quoteAsset.formatDisplayAmount(this._quoteAsset.balance);
    }
    if (!this._baseAsset) {
      return undefined;
    }
    return this._baseAsset.formatDisplayAmount(this._baseAsset.balance);
  }

  set buySell(x: BuySell) {
    this._buySell = x;
  }

  get lastEdited(): LastEdited {
    return this._lastEdited;
  }

  assetChange(base: AssetInfo, quote: AssetInfo) {
    this._baseAsset = base;
    this._quoteAsset = quote;
    this._baseAssetInput = '';
    this._quoteAssetInput = '';
  }

  get plan(): undefined | MarketOrderPlan {
    if (!this._baseAsset || !this._quoteAsset) {
      return;
    }
    const { inputAsset, inputAmount, output } =
      this._buySell === 'Buy'
        ? {
            inputAsset: this._quoteAsset,
            inputAmount: this.quoteInputAmount,
            output: this._baseAsset,
          }
        : {
            inputAsset: this._baseAsset,
            inputAmount: this.baseInputAmount,
            output: this._quoteAsset,
          };
    if (inputAmount === undefined) {
      return;
    }
    return {
      targetAsset: output.id,
      value: inputAsset.value(inputAmount),
    };
  }
}
