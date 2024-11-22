import { makeAutoObservable } from 'mobx';
import debounce from 'lodash/debounce';
import times from 'lodash/times';
import { SimulationService } from '@penumbra-zone/protobuf';
import {
  BalancesResponse,
  TransactionPlannerRequest,
} from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import {
  SimulateTradeRequest,
  PositionState_PositionStateEnum,
  PositionOpen,
  Reserves,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { splitLoHi } from '@penumbra-zone/types/lo-hi';
import { getAssetId } from '@penumbra-zone/getters/metadata';
import { getSwapCommitmentFromTx } from '@penumbra-zone/getters/transaction';
import { getAssetIdFromValueView } from '@penumbra-zone/getters/value-view';
import { getFormattedAmtFromValueView } from '@penumbra-zone/types/value-view';
import { penumbra } from '@/shared/const/penumbra';
import { plan, planBuildBroadcast } from '../helpers';
import { openToast } from '@penumbra-zone/ui/Toast';
import { useEffect } from 'react';
import { useBalances } from '@/shared/api/balances';
import { usePathToMetadata } from '../../../model/use-path';
import { OrderFormAsset } from './asset';
import { RangeLiquidity } from './range-liquidity';

export enum Direction {
  Buy = 'Buy',
  Sell = 'Sell',
}

export enum FormType {
  Market = 'Market',
  Limit = 'Limit',
  RangeLiquidity = 'RangeLiquidity',
}

class OrderFormStore {
  type: FormType = FormType.Market;
  direction: Direction = Direction.Buy;
  baseAsset = new OrderFormAsset();
  quoteAsset = new OrderFormAsset();
  rangeLiquidity = new RangeLiquidity();
  balances: BalancesResponse[] | undefined;
  exchangeRate: number | null = null;
  gasFee: number | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this);

    void this.calculateGasFee();
    void this.calculateExchangeRate();
  }

  setType = (type: FormType): void => {
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

  private simulateSwapTx = async (
    assetIn: OrderFormAsset,
    assetOut: OrderFormAsset,
  ): Promise<ValueView | void> => {
    try {
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

      return output;
    } catch (e) {
      if (
        e instanceof Error &&
        e.name !== 'PenumbraProviderNotAvailableError' &&
        e.name !== 'PenumbraProviderNotConnectedError'
      ) {
        openToast({
          type: 'error',
          message: e.name,
          description: e.message,
        });
      }
    }
  };

  setAssets = (baseAsset: Metadata, quoteAsset: Metadata): void => {
    this.baseAsset = new OrderFormAsset(baseAsset);
    this.quoteAsset = new OrderFormAsset(quoteAsset);

    const debouncedHandleAmountChange = debounce(this.handleAmountChange, 500);

    this.baseAsset.onAmountChange(
      debouncedHandleAmountChange as (asset: OrderFormAsset) => Promise<void>,
    );
    this.quoteAsset.onAmountChange(
      debouncedHandleAmountChange as (asset: OrderFormAsset) => Promise<void>,
    );

    this.setBalancesOfAssets();
    void this.calculateGasFee();
    void this.calculateExchangeRate();
  };

  setBalances = (balances: BalancesResponse[]): void => {
    this.balances = balances;
    this.setBalancesOfAssets();
  };

  handleAmountChange = async (asset: OrderFormAsset): Promise<void> => {
    const assetIsBaseAsset = asset.assetId === this.baseAsset.assetId;
    const assetIn = assetIsBaseAsset ? this.baseAsset : this.quoteAsset;
    const assetOut = assetIsBaseAsset ? this.quoteAsset : this.baseAsset;

    try {
      void this.calculateGasFee();

      assetOut.setIsEstimating(true);

      const output = await this.simulateSwapTx(assetIn, assetOut);
      if (!output) {
        return;
      }

      const outputAmount = getFormattedAmtFromValueView(output, true);

      assetOut.setAmount(Number(outputAmount), false);
    } finally {
      assetOut.setIsEstimating(false);
    }
  };

  calculateExchangeRate = async (): Promise<void> => {
    this.exchangeRate = null;

    const baseAsset: OrderFormAsset = new OrderFormAsset(this.baseAsset.metadata);
    baseAsset.setAmount(1);

    const output = await this.simulateSwapTx(baseAsset, this.quoteAsset);
    if (!output) {
      return;
    }

    const outputAmount = getFormattedAmtFromValueView(output, true);
    this.exchangeRate = Number(outputAmount);
  };

  calculateGasFee = async (): Promise<void> => {
    this.gasFee = null;

    const isBuy = this.direction === Direction.Buy;
    const assetIn = isBuy ? this.quoteAsset : this.baseAsset;
    const assetOut = isBuy ? this.baseAsset : this.quoteAsset;

    if (!assetIn.amount || !assetOut.amount) {
      this.gasFee = 0;
      return;
    }

    const req = new TransactionPlannerRequest({
      swaps: [
        {
          targetAsset: assetOut.assetId,
          value: {
            amount: assetIn.toLoHi(),
            assetId: assetIn.assetId,
          },
          claimAddress: assetIn.accountAddress,
        },
      ],
      source: assetIn.accountIndex,
    });

    const txPlan = await plan(req);
    const fee = txPlan.transactionParameters?.fee;
    const feeValueView = new ValueView({
      valueView: {
        case: 'knownAssetId',
        value: {
          amount: fee?.amount ?? { hi: 0n, lo: 0n },
          metadata: this.baseAsset.metadata,
        },
      },
    });

    const feeAmount = getFormattedAmtFromValueView(feeValueView, true);
    this.gasFee = Number(feeAmount);
  };

  initiateSwapTx = async (): Promise<void> => {
    try {
      this.isLoading = true;

      const isBuy = this.direction === Direction.Buy;
      const assetIn = isBuy ? this.quoteAsset : this.baseAsset;
      const assetOut = isBuy ? this.baseAsset : this.quoteAsset;

      if (!assetIn.amount || !assetOut.amount) {
        openToast({
          type: 'error',
          message: 'Please enter an amount.',
        });
        return;
      }

      const swapReq = new TransactionPlannerRequest({
        swaps: [
          {
            targetAsset: assetOut.assetId,
            value: {
              amount: assetIn.toLoHi(),
              assetId: assetIn.assetId,
            },
            claimAddress: assetIn.accountAddress,
          },
        ],
        source: assetIn.accountIndex,
      });

      const swapTx = await planBuildBroadcast('swap', swapReq);
      const swapCommitment = getSwapCommitmentFromTx(swapTx);

      // Issue swap claim
      const req = new TransactionPlannerRequest({
        swapClaims: [{ swapCommitment }],
        source: assetIn.accountIndex,
      });
      await planBuildBroadcast('swapClaim', req, { skipAuth: true });

      assetIn.unsetAmount();
      assetOut.unsetAmount();
    } finally {
      this.isLoading = false;
    }
  };

  // ref: https://github.com/penumbra-zone/penumbra/blob/main/crates/bin/pcli/src/command/tx/replicate/linear.rs
  initiatePositionsTx = async (): Promise<void> => {
    try {
      this.isLoading = true;

      const { lowerBound, upperBound, positions, marketPrice, feeTier } = this.rangeLiquidity;
      if (
        !this.quoteAsset.amount ||
        !lowerBound ||
        !upperBound ||
        !positions ||
        !marketPrice ||
        !feeTier
      ) {
        openToast({
          type: 'error',
          message: 'Please enter a valid range.',
        });
        return;
      }

      const positionAmount = BigInt(this.quoteAsset.amount / positions);
      const baseAssetUnitAmount = this.baseAsset.toUnitAmount();
      const quoteAssetUnitAmount = this.quoteAsset.toUnitAmount();

      const positionsReq = new TransactionPlannerRequest({
        positionOpens: times(positions, (i): PositionOpen => {
          const price = BigInt(lowerBound + (i * (upperBound - lowerBound)) / (positions - 1));

          // Cross-multiply exponents and prices for trading function coefficients
          //
          // We want to write
          // p = EndUnit * price
          // q = StartUnit
          // However, if EndUnit is too small, it might not round correctly after multiplying by price
          // To handle this, conditionally apply a scaling factor if the EndUnit amount is too small.
          const scale = BigInt(quoteAssetUnitAmount < 1_000_000 ? 1_000_000 : 1);

          const p = splitLoHi(quoteAssetUnitAmount * scale * price);
          const q = splitLoHi(baseAssetUnitAmount * scale);

          // Compute reserves
          const reserves: Reserves =
            price < marketPrice
              ? // If the position's price is _less_ than the current price, fund it with asset 2
                // so the position isn't immediately arbitraged.
                {
                  r1: { lo: 0n },
                  r2: splitLoHi(positionAmount),
                }
              : // If the position's price is _greater_ than the current price, fund it with
                // an equivalent amount of asset 1 as the target per-position amount of asset 2.
                {
                  r1: splitLoHi(positionAmount / price),
                  r2: { lo: 0n },
                };

          return {
            position: {
              phi: {
                component: { p, q },
                pair: {
                  asset1: this.baseAsset.assetId,
                  asset2: this.quoteAsset.assetId,
                },
              },
              nonce: crypto.getRandomValues(new Uint8Array(32)),
              state: { state: PositionState_PositionStateEnum.OPENED },
              reserves,
              closeOnFill: true,
            },
          };
        }),
        source: this.baseAsset.accountIndex,
        feeMode: {
          case: 'manualFee',
          value: {
            amount: splitLoHi(BigInt(feeTier)),
            assetId: this.baseAsset.assetId,
          },
        },
      });

      const positionsTx = await planBuildBroadcast('positionOpen', positionsReq);
      console.log('TCL: OrderFormStore -> positionsTx', positionsTx);
      // const positionsCommitment = getSwapCommitmentFromTx(positionsTx);

      // Issue swap claim
      // const req = new TransactionPlannerRequest({
      //   // swapClaims: [{ swapCommitment }],
      //   source: assetIn.accountIndex,
      // });
      // await planBuildBroadcast('positionOpen', req, { skipAuth: true });

      // assetIn.unsetAmount();
      // assetOut.unsetAmount();
    } finally {
      this.isLoading = false;
    }
  };

  submitOrder = (): void => {
    if (this.type === FormType.Market) {
      void this.initiateSwapTx();
    }

    if (this.type === FormType.RangeLiquidity) {
      void this.initiatePositionsTx();
    }
  };
}

export const orderFormStore = new OrderFormStore();

export const useOrderFormStore = (type: FormType) => {
  const { baseAsset, quoteAsset } = usePathToMetadata();
  const { data: balances } = useBalances();
  const { setAssets, setBalances, setType } = orderFormStore;

  useEffect(() => {
    setType(type);
  }, [type, setType]);

  useEffect(() => {
    if (baseAsset && quoteAsset) {
      setAssets(baseAsset, quoteAsset);
    }
  }, [baseAsset, quoteAsset, setAssets]);

  useEffect(() => {
    if (balances) {
      setBalances(balances);
    }
  }, [balances, setBalances]);

  return orderFormStore;
};
