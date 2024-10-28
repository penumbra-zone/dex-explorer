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
import {
  AssetId,
  Metadata,
  Value,
  ValueView,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { BigNumber } from 'bignumber.js';
import { StateCommitment } from '@penumbra-zone/protobuf/penumbra/crypto/tct/v1/tct_pb';
import { errorToast } from '@penumbra-zone/ui/lib/toast/presets';
import {
  SwapExecution,
  SwapExecution_Trace,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { ViewService } from '@penumbra-zone/protobuf';
import {
  getAssetIdFromValueView,
  getDisplayDenomExponentFromValueView,
  getMetadata,
} from '@penumbra-zone/getters/value-view';
import { getAssetId } from '@penumbra-zone/getters/metadata';
import { getSwapCommitmentFromTx } from '@penumbra-zone/getters/transaction';
import { getAddressIndex } from '@penumbra-zone/getters/address-view';
import { toBaseUnit } from '@penumbra-zone/types/lo-hi';
import { getAmountFromValue, getAssetIdFromValue } from '@penumbra-zone/getters/value';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { divideAmounts } from '@penumbra-zone/types/amount';
import { bech32mAssetId } from '@penumbra-zone/bech32m/passet';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';

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

class OrderFormAsset {
  symbol: string;
  metadata?: Metadata;
  balance?: BalancesResponse;
  amount?: number;

  constructor(metadata?: Metadata) {
    this.metadata = metadata;
    this.symbol = metadata?.symbol ?? '';
  }

  setBalance = (balance: BalancesResponse): void => {
    this.balance = balance;
  };

  setAmount = (amount: number): void => {
    this.amount = amount;
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
      getAssetIdFromValueView(resp.balanceView).equals(getAssetId(this.baseAsset?.metadata)),
    );
    if (baseAssetBalance) {
      this.baseAsset.setBalance(baseAssetBalance);
    }

    const quoteAssetBalance = this.balances?.find(resp =>
      getAssetIdFromValueView(resp.balanceView).equals(getAssetId(this.quoteAsset?.metadata)),
    );
    if (quoteAssetBalance) {
      this.quoteAsset.setBalance(quoteAssetBalance);
    }
  };

  setAssets = (baseAsset: Metadata, quoteAsset: Metadata): void => {
    this.baseAsset = new OrderFormAsset(baseAsset);
    this.quoteAsset = new OrderFormAsset(quoteAsset);
    this.setBalancesOfAssets();
  };

  setBalances = (balances: BalancesResponse[]): void => {
    this.balances = balances;
    this.setBalancesOfAssets();
  };

  initiateSwapTx = (): void => {
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
  };

  submitOrder = (): void => {
    if (this.type === OrderType.Swap) {
      this.initiateSwapTx();
    }

    // @TODO: handle other order types
  };

  setIsLoading = (isLoading: boolean): void => {
    this.isLoading = isLoading;
  };
}

export const orderFormStore = new OrderFormStore();
