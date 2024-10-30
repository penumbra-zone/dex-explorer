import { makeAutoObservable } from 'mobx';
import { BigNumber } from 'bignumber.js';
import { round } from 'lodash';
import { ViewService, SimulationService } from '@penumbra-zone/protobuf';
import { PartialMessage } from '@bufbuild/protobuf';
import {
  BalancesResponse,
  TransactionPlannerRequest,
} from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import {
  AssetId,
  Metadata,
  Value,
  ValueView,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { SimulateTradeRequest } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { getAssetId, getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { getSwapCommitmentFromTx } from '@penumbra-zone/getters/transaction';
import { getAddressIndex, getAddress } from '@penumbra-zone/getters/address-view';
import { getAssetIdFromValueView } from '@penumbra-zone/getters/value-view';
import { getFormattedAmtFromValueView } from '@penumbra-zone/types/value-view';
import { toBaseUnit } from '@penumbra-zone/types/lo-hi';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { AddressIndex, AddressView } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { Transaction } from '@penumbra-zone/protobuf/penumbra/core/transaction/v1/transaction_pb';
// import { TransactionToast } from '@penumbra-zone/ui/lib/toast/transaction-toast';
import { TransactionClassification } from '@penumbra-zone/perspective/transaction/classification';
import { uint8ArrayToHex } from '@penumbra-zone/types/hex';
import { penumbra } from '@/shared/penumbra';

export enum Direction {
  Buy = 'Buy',
  Sell = 'Sell',
}

export enum OrderType {
  Swap = 'Swap',
}

function TransactionToast() {
  return {};
}

export const userDeniedTransaction = (e: unknown): boolean =>
  e instanceof Error && e.message.startsWith('[permission_denied]');

export const unauthenticated = (e: unknown): boolean =>
  e instanceof Error && e.message.startsWith('[unauthenticated]');

/**
 * Handles the common use case of planning, building, and broadcasting a
 * transaction, along with the appropriate toasts. Throws if there is an
 * unhandled error (i.e., any error other than the user denying authorization
 * for the transaction) so that consuming code can take different actions based
 * on whether the transaction succeeded or failed.
 */
export const planBuildBroadcast = async (
  transactionClassification: TransactionClassification,
  req: PartialMessage<TransactionPlannerRequest>,
  options?: {
    /**
     * If set to `true`, the `ViewService#witnessAndBuild` method will be used,
     * which does not prompt the user to authorize the transaction. If `false`,
     * the `ViewService#authorizeAndBuild` method will be used, which _does_
     * prompt the user to authorize the transaction. (This is required in the
     * case of most transactions.) Default: `false`
     */
    skipAuth?: boolean;
  },
): Promise<Transaction | undefined> => {
  const toast = new TransactionToast(transactionClassification);
  toast.onStart();

  const rpcMethod = options?.skipAuth
    ? penumbra.service(ViewService).witnessAndBuild
    : penumbra.service(ViewService).authorizeAndBuild;

  try {
    const transactionPlan = await plan(req);

    const transaction = await build({ transactionPlan }, rpcMethod, status =>
      toast.onBuildStatus(status),
    );

    const txHash = uint8ArrayToHex((await txSha256(transaction)).inner);
    toast.txHash(txHash);

    const { detectionHeight } = await broadcast({ transaction, awaitDetection: true }, status =>
      toast.onBroadcastStatus(status),
    );
    toast.onSuccess(detectionHeight);

    return transaction;
  } catch (e) {
    if (userDeniedTransaction(e)) {
      toast.onDenied();
    } else if (unauthenticated(e)) {
      toast.onUnauthenticated();
    } else {
      toast.onFailure(e);
      throw e;
    }
  }

  return undefined;
};

export class OrderFormAsset {
  symbol: string;
  metadata?: Metadata;
  exponent?: number;
  assetId?: AssetId;
  balanceView?: ValueView;
  accountAddress?: AddressView;
  balance?: number;
  amount?: number;
  onAmountChangeCallback?: (asset: OrderFormAsset) => void;
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

  setAccountAddress = (accountAddress: AddressView): void => {
    this.accountAddress = accountAddress;
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

  setIsEstimating = (isEstimating: boolean): void => {
    this.isEstimating = isEstimating;
  };

  setIsApproximately = (isApproximately: boolean): void => {
    this.isApproximately = isApproximately;
  };

  onAmountChange = (callback: (asset: OrderFormAsset) => void): void => {
    this.onAmountChangeCallback = callback;
  };

  toAmount = (): Amount => {
    return toBaseUnit(BigNumber(this.amount ?? 0), this.exponent);
  };

  toValue = (): Value => {
    return new Value({
      assetId: this.assetId,
      amount: this.toAmount(),
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
    if (baseAssetBalance?.accountAddress) {
      this.baseAsset.setAccountAddress(baseAssetBalance.accountAddress);
    }

    const quoteAssetBalance = this.balances?.find(resp =>
      getAssetIdFromValueView(resp.balanceView).equals(getAssetId(this.quoteAsset.metadata)),
    );
    if (quoteAssetBalance?.balanceView) {
      this.quoteAsset.setBalanceView(quoteAssetBalance.balanceView);
    }
    if (quoteAssetBalance?.accountAddress) {
      this.quoteAsset.setAccountAddress(quoteAssetBalance.accountAddress);
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
      assetOut.setIsEstimating(true);

      // reset potentially previously set flag
      assetIn.setIsApproximately(false);

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

      const outputAmount = getFormattedAmtFromValueView(output, true);
      assetOut.setAmount(Number(outputAmount), false);
      assetOut.setIsApproximately(true);
    } catch (e) {
      // @TODO: handle error
      console.error(e);
    } finally {
      assetOut.setIsEstimating(false);
    }
  };

  initiateSwapTx = async (): Promise<void> => {
    try {
      this.isLoading = true;

      const isBuy = this.direction === Direction.Buy;
      const assetIn = isBuy ? this.quoteAsset : this.baseAsset;
      const assetOut = isBuy ? this.baseAsset : this.quoteAsset;

      const source = getAddressIndex(assetIn.accountAddress);

      const swapReq = new TransactionPlannerRequest({
        swaps: [
          {
            targetAsset: assetOut.assetId,
            value: {
              amount: assetIn.toAmount(),
              assetId: assetIn.assetId,
            },
            claimAddress: getAddress(assetIn.accountAddress),
          },
        ],
        source,
      });

      const swapTx = await planBuildBroadcast('swap', swapReq);
      const swapCommitment = getSwapCommitmentFromTx(swapTx);

      // Issue swap claim
      const req = new TransactionPlannerRequest({ swapClaims: [{ swapCommitment }], source });
      await planBuildBroadcast('swapClaim', req, { skipAuth: true });

      assetIn.setAmount(0);
      assetOut.setAmount(0);
    } finally {
      this.isLoading = false;
    }
  };

  submitOrder = (): void => {
    if (this.type === OrderType.Swap) {
      this.initiateSwapTx();
    }

    // @TODO: handle other order types
  };
}

export const orderFormStore = new OrderFormStore();
