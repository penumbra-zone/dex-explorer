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
import { divideAmounts } from '@penumbra-zone/types/amount';
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

const getMetadataByAssetId = async (
  traces: SwapExecution_Trace[] = [],
): Promise<Record<string, Metadata>> => {
  const map: Record<string, Metadata> = {};

  const promises = traces.flatMap(trace =>
    trace.value.map(async value => {
      if (!value.assetId || map[bech32mAssetId(value.assetId)]) {
        return;
      }

      const { denomMetadata } = await penumbra
        .service(ViewService)
        .assetMetadataById({ assetId: value.assetId });

      if (denomMetadata) {
        map[bech32mAssetId(value.assetId)] = denomMetadata;
      }
    }),
  );

  await Promise.all(promises);

  return map;
};

const getMatchingAmount = (values: Value[], toMatch: AssetId): Amount => {
  const match = values.find(v => toMatch.equals(v.assetId));
  if (!match?.amount) {
    throw new Error('No match in values array found');
  }

  return match.amount;
};

/*
  Price impact is the change in price as a consequence of the trade's size. In SwapExecution, the \
  first trace in the array is the best execution for the swap. To calculate price impact, take
  the price of the trade and see the % diff off the best execution trace.
 */
const calculatePriceImpact = (swapExec?: SwapExecution): number | undefined => {
  if (!swapExec?.traces.length || !swapExec.output || !swapExec.input) {
    return undefined;
  }

  // Get the price of the estimate for the swap total
  const inputAmount = getAmountFromValue(swapExec.input);
  const outputAmount = getAmountFromValue(swapExec.output);
  const swapEstimatePrice = divideAmounts(outputAmount, inputAmount);

  // Get the price in the best execution trace
  const inputAssetId = getAssetIdFromValue(swapExec.input);
  const outputAssetId = getAssetIdFromValue(swapExec.output);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: justify non-null assertion
  const bestTrace = swapExec.traces[0]!;
  const bestInputAmount = getMatchingAmount(bestTrace.value, inputAssetId);
  const bestOutputAmount = getMatchingAmount(bestTrace.value, outputAssetId);
  const bestTraceEstimatedPrice = divideAmounts(bestOutputAmount, bestInputAmount);

  // Difference = (priceB - priceA) / priceA
  const percentDifference = swapEstimatePrice
    .minus(bestTraceEstimatedPrice)
    .div(bestTraceEstimatedPrice);

  return percentDifference.toNumber();
};

export class OrderFormAsset {
  symbol: string;
  metadata?: Metadata;
  balanceView?: ValueView;
  balance?: number;
  amount?: number;
  onAmountChangeCallback?: Function;

  constructor(metadata?: Metadata) {
    makeAutoObservable(this);

    this.metadata = metadata;
    this.symbol = metadata?.symbol ?? '';
  }

  setBalanceView = (balanceView: ValueView): void => {
    this.balanceView = balanceView;
    this.setBalanceFromBalanceView(balanceView);
  };

  setBalanceFromBalanceView = (balanceView: ValueView): void => {
    const balance = getFormattedAmtFromValueView(balanceView, true);
    this.balance = Number(balance);
  };

  setAmount = (amount: number): void => {
    this.amount = Math.max(0, Math.min(amount, this.balance ?? 0));

    if (this.onAmountChangeCallback) {
      this.onAmountChangeCallback(this.amount);
    }
  };

  onAmountChange = (callback: Function): void => {
    this.onAmountChangeCallback = callback;
  };
}

class OrderFormStore {
  type: OrderType = OrderType.Swap;
  direction: Direction = Direction.Buy;
  baseAsset = new OrderFormAsset();
  quoteAsset = new OrderFormAsset();
  balances: BalancesResponse[] | undefined;
  isEstimating = false;
  isLoading = false;
  simulateSwapResult: any;

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

  simulateSwapTx = async (): Promise<void> => {
    try {
      this.isEstimating = true;

      const req = new SimulateTradeRequest({
        input: new Value({
          assetId: getAssetId(this.quoteAsset.metadata),
          amount: toBaseUnit(
            BigNumber(this.quoteAsset.amount ?? 0),
            getDisplayDenomExponent(this.quoteAsset.metadata),
          ),
        }),
        output: getAssetId(this.baseAsset.metadata),
      });

      const res = await penumbra.service(SimulationService).simulateTrade(req);
      console.log('TCL: OrderFormStore -> res', res);

      const output = new ValueView({
        valueView: {
          case: 'knownAssetId',
          value: {
            amount: res.output?.output?.amount,
            metadata: this.baseAsset.metadata,
          },
        },
      });

      const unfilled = new ValueView({
        valueView: {
          case: 'knownAssetId',
          value: {
            amount: res.unfilled?.amount,
            metadata: this.quoteAsset.metadata,
          },
        },
      });

      const metadataByAssetId = await getMetadataByAssetId(res.output?.traces);

      this.simulateSwapResult = {
        output,
        unfilled,
        priceImpact: calculatePriceImpact(res.output),
        traces: res.output?.traces,
        metadataByAssetId,
      };
    } catch (e) {
      // @TODO: handle error
      // errorToast(e, 'Error estimating swap').render();
    } finally {
      this.isEstimating = false;
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
