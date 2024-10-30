import { makeAutoObservable } from 'mobx';
import {
  AuthorizeAndBuildRequest,
  AuthorizeAndBuildResponse,
  BalancesResponse,
  BroadcastTransactionRequest,
  BroadcastTransactionResponse,
  TransactionPlannerRequest,
  WitnessAndBuildRequest,
  WitnessAndBuildResponse,
} from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { getFormattedAmtFromValueView } from '@penumbra-zone/types/value-view';
import {
  AssetId,
  Metadata,
  Value,
  ValueView,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { BigNumber } from 'bignumber.js';
import { round } from 'lodash';
import { StateCommitment } from '@penumbra-zone/protobuf/penumbra/crypto/tct/v1/tct_pb';
import { errorToast } from '@penumbra-zone/ui/lib/toast/presets';
import {
  SwapExecution,
  SwapExecution_Trace,
  SimulateTradeRequest,
  SimulateTradeResponse,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import {
  getAmount,
  getAssetIdFromValueView,
  getDisplayDenomExponentFromValueView,
  getMetadata,
} from '@penumbra-zone/getters/value-view';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { getAssetId } from '@penumbra-zone/getters/metadata';
import { ViewService, DexService, SimulationService } from '@penumbra-zone/protobuf';
import { getSwapCommitmentFromTx } from '@penumbra-zone/getters/transaction';
import { getAddressIndex } from '@penumbra-zone/getters/address-view';
import { toBaseUnit, joinLoHi } from '@penumbra-zone/types/lo-hi';
import { getAmountFromValue, getAssetIdFromValue } from '@penumbra-zone/getters/value';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { divideAmounts, formatAmount, removeTrailingZeros } from '@penumbra-zone/types/amount';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { penumbra } from '@/shared/penumbra';

export enum Direction {
  Buy = 'Buy',
  Sell = 'Sell',
}

export enum OrderType {
  Swap = 'Swap',
}

// export const amountMoreThanBalance = (
//   asset: BalancesResponse,
//   /**
//    * The amount that a user types into the interface will always be in the
//    * display denomination -- e.g., in `penumbra`, not in `upenumbra`.
//    */
//   amountInDisplayDenom: string,
// ): boolean => {
//   if (!asset.balanceView) {
//     throw new Error('Missing balanceView');
//   }

//   const balanceAmt = fromValueView(asset.balanceView);
//   return Boolean(amountInDisplayDenom) && BigNumber(amountInDisplayDenom).gt(balanceAmt);
// };

// /**
//  * Checks if the entered amount fraction part is longer than the asset's exponent
//  */
// export const isIncorrectDecimal = (
//   asset: BalancesResponse,
//   /**
//    * The amount that a user types into the interface will always be in the
//    * display denomination -- e.g., in `penumbra`, not in `upenumbra`.
//    */
//   amountInDisplayDenom: string,
// ): boolean => {
//   if (!asset.balanceView) {
//     throw new Error('Missing balanceView');
//   }

//   const exponent = getDisplayDenomExponent.optional(
//     getMetadataFromBalancesResponse.optional(asset),
//   );
//   const fraction = amountInDisplayDenom.split('.')[1]?.length;
//   return typeof exponent !== 'undefined' && typeof fraction !== 'undefined' && fraction > exponent;
// };

// const isValidAmount = (amount: string, assetIn?: BalancesResponse) =>
//   Number(amount) >= 0 &&
//   (!assetIn || !amountMoreThanBalance(assetIn, amount)) &&
//   (!assetIn || !isIncorrectDecimal(assetIn, amount));

// const assembleSwapRequest = async ({
//   assetIn,
//   amount,
//   assetOut,
// }: Pick<SwapSlice, 'assetIn' | 'assetOut' | 'amount'>) => {
//   if (!assetIn) {
//     throw new Error('`assetIn` is undefined');
//   }
//   if (!assetOut) {
//     throw new Error('`assetOut` is undefined');
//   }
//   if (!isValidAmount(amount, assetIn)) {
//     throw new Error('Invalid amount');
//   }

//   const addressIndex = getAddressIndex(assetIn.accountAddress);

//   return new TransactionPlannerRequest({
//     swaps: [
//       {
//         targetAsset: getAssetId(assetOut),
//         value: {
//           amount: toBaseUnit(
//             BigNumber(amount),
//             getDisplayDenomExponentFromValueView(assetIn.balanceView),
//           ),
//           assetId: getAssetIdFromValueView(assetIn.balanceView),
//         },
//         claimAddress: await getAddressByIndex(addressIndex.account),
//       },
//     ],
//     source: getAddressIndex(assetIn.accountAddress),
//   });
// };

// const metadata = isBalancesResponse(value)
// ? getMetadataFromBalancesResponse.optional(value)
// : value;

// const balance = isBalancesResponse(value)
// ? {
//     addressIndexAccount: getAddressIndex.optional(value)?.account,
//     valueView: getBalanceView.optional(value),
//   }
// : undefined;

export class OrderFormAsset {
  symbol: string;
  metadata?: Metadata;
  exponent?: number;
  assetId?: AssetId;
  balanceView?: ValueView;
  balance?: number;
  amount?: number;
  onAmountChangeCallback?: Function;
  isEstimating = false;
  isApproximately = false;

  constructor(metadata?: Metadata) {
    makeAutoObservable(this);

    this.metadata = metadata;
    this.symbol = metadata?.symbol ?? '';
    this.assetId = metadata ? getAssetId(metadata) : undefined;
    this.exponent = metadata ? getDisplayDenomExponent(metadata) : undefined;
  }

  setBalanceView = (balanceView: ValueView): void => {
    this.balanceView = balanceView;
    this.setBalanceFromBalanceView(balanceView);
  };

  setBalanceFromBalanceView = (balanceView: ValueView): void => {
    const balance = getFormattedAmtFromValueView(balanceView, true);
    this.balance = Number(balance);
  };

  setAmount = (amount: number, callOnAmountChange = true): void => {
    const prevAmount = this.amount;
    const nextAmount = round(amount, this.exponent);

    if (prevAmount !== nextAmount) {
      this.amount = nextAmount;

      if (this.onAmountChangeCallback && callOnAmountChange) {
        this.onAmountChangeCallback(this);
      }
    }
  };

  onAmountChange = (callback: Function): void => {
    this.onAmountChangeCallback = callback;
  };

  toValue = (): Value => {
    return new Value({
      assetId: this.assetId,
      amount: toBaseUnit(BigNumber(this.amount ?? 0), this.exponent),
    });
  };
}

class OrderFormStore {
  type: OrderType = OrderType.Swap;
  direction: Direction = Direction.Buy;
  baseAsset = new OrderFormAsset();
  quoteAsset = new OrderFormAsset();
  balances: BalancesResponse[] | undefined;
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  setType = (type: OrderType): void => {
    this.type = type;
  };

  setDirection = (direction: Direction): void => {
    this.direction = direction;
  };

  private setBalancesOfAssets = (): void => {
    const baseAssetBalance = this.balances?.find(resp =>
      getAssetIdFromValueView(resp.balanceView).equals(getAssetId(this.baseAsset.metadata)),
    );
    if (baseAssetBalance?.balanceView) {
      this.baseAsset.setBalanceView(baseAssetBalance.balanceView);
    }

    const quoteAssetBalance = this.balances?.find(resp =>
      getAssetIdFromValueView(resp.balanceView).equals(getAssetId(this.quoteAsset.metadata)),
    );
    if (quoteAssetBalance?.balanceView) {
      this.quoteAsset.setBalanceView(quoteAssetBalance.balanceView);
    }
  };

  setAssets = (baseAsset: Metadata, quoteAsset: Metadata): void => {
    this.baseAsset = new OrderFormAsset(baseAsset);
    this.quoteAsset = new OrderFormAsset(quoteAsset);

    this.baseAsset.onAmountChange(this.simulateSwapTx);
    this.quoteAsset.onAmountChange(this.simulateSwapTx);

    this.setBalancesOfAssets();
  };

  setBalances = (balances: BalancesResponse[]): void => {
    this.balances = balances;
    this.setBalancesOfAssets();
  };

  simulateSwapTx = async (asset: OrderFormAsset): Promise<void> => {
    const assetIsBaseAsset = asset.assetId === this.baseAsset.assetId;
    const assetIn = assetIsBaseAsset ? this.baseAsset : this.quoteAsset;
    const assetOut = assetIsBaseAsset ? this.quoteAsset : this.baseAsset;

    try {
      assetOut.isEstimating = true;

      // reset potentially previously set flag
      assetIn.isApproximately = false;

      const req = new SimulateTradeRequest({
        input: assetIn.toValue(),
        output: assetOut.assetId,
      });

      const res = await penumbra.service(SimulationService).simulateTrade(req);

      const output = new ValueView({
        valueView: {
          case: 'knownAssetId',
          value: {
            amount: res.output?.output?.amount,
            metadata: assetOut.metadata,
          },
        },
      });

      const unfilled = new ValueView({
        valueView: {
          case: 'knownAssetId',
          value: {
            amount: res.unfilled?.amount,
            metadata: assetIn.metadata,
          },
        },
      });

      const outputAmount = getFormattedAmtFromValueView(output, true);
      assetOut.setAmount(Number(outputAmount), false);
      assetOut.isApproximately = true;
    } catch (e) {
      // @TODO: handle error
      console.error(e);
    } finally {
      assetOut.isEstimating = false;
    }
  };

  initiateSwapTx = async (): Promise<void> => {
    this.isLoading = true;

    // try {
    //   const swapReq = await assembleSwapRequest(get().swap);
    //   const swapTx = await planBuildBroadcast('swap', swapReq);
    //   const swapCommitment = getSwapCommitmentFromTx(swapTx);
    //   await issueSwapClaim(swapCommitment, swapReq.source);

    //   set(state => {
    //     state.swap.amount = '';
    //   });
    //   get().shared.balancesResponses.revalidate();
    // } finally {
    //   set(state => {
    //     state.swap.instantSwap.txInProgress = false;
    //   });
    // }

    this.isLoading = false;
  };

  submitOrder = (): void => {
    if (this.type === OrderType.Swap) {
      this.initiateSwapTx();
    }

    // @TODO: handle other order types
  };
}

export const orderFormStore = new OrderFormStore();
