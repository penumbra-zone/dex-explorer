import { useEffect } from 'react';
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
  TradingPair,
  Position,
  PositionState,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { getAssetId } from '@penumbra-zone/getters/metadata';
import { getSwapCommitmentFromTx } from '@penumbra-zone/getters/transaction';
import { getAssetIdFromValueView } from '@penumbra-zone/getters/value-view';
import { getFormattedAmtFromValueView } from '@penumbra-zone/types/value-view';
import { pnum } from '@penumbra-zone/types/pnum';
import { openToast } from '@penumbra-zone/ui/Toast';
import { penumbra } from '@/shared/const/penumbra';
import { useBalances } from '@/shared/api/balances';
import { plan, planBuildBroadcast } from '../helpers';
import { usePathToMetadata } from '../../../model/use-path';
import { OrderFormAsset } from './asset';
import { RangeLiquidity } from './range-liquidity';
import { LimitOrder } from './limit-order';

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
  limitOrder = new LimitOrder();
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
      getAssetIdFromValueView(resp.balanceView).equals(
        getAssetId.optional(this.baseAsset.metadata),
      ),
     );
     if (baseAssetBalance?.balanceView) {
       this.baseAsset.setBalanceView(baseAssetBalance.balanceView);
     }
     if (baseAssetBalance?.accountAddress) {
       this.baseAsset.setAccountAddress(baseAssetBalance.accountAddress);
     }
 
     const quoteAssetBalance = this.balances?.find(resp =>
      getAssetIdFromValueView(resp.balanceView).equals(
        getAssetId.optional(this.quoteAsset.metadata),
      ),
     );
     if (quoteAssetBalance?.balanceView) {
       this.quoteAsset.setBalanceView(quoteAssetBalance.balanceView);
     }
     if (quoteAssetBalance?.accountAddress) {
       this.quoteAsset.setAccountAddress(quoteAssetBalance.accountAddress);
    try {
      if (!this.balances?.length) {
        return;
      }

      const baseAssetBalance = this.balances.find(resp =>
        getAssetIdFromValueView(resp.balanceView).equals(getAssetId(this.baseAsset.metadata)),
      );
      if (baseAssetBalance?.balanceView) {
        this.baseAsset.setBalanceView(baseAssetBalance.balanceView);
      }
      if (baseAssetBalance?.accountAddress) {
        this.baseAsset.setAccountAddress(baseAssetBalance.accountAddress);
      }

      const quoteAssetBalance = this.balances.find(resp =>
        getAssetIdFromValueView(resp.balanceView).equals(getAssetId(this.quoteAsset.metadata)),
      );
      if (quoteAssetBalance?.balanceView) {
        this.quoteAsset.setBalanceView(quoteAssetBalance.balanceView);
      }
      if (quoteAssetBalance?.accountAddress) {
        this.quoteAsset.setAccountAddress(quoteAssetBalance.accountAddress);
      }
    } catch (e) {
      openToast({
        type: 'error',
        message: 'Error setting form balances',
        description: JSON.stringify(e),
      });
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
    }
  };

  setAssets = (baseAsset: Metadata, quoteAsset: Metadata): void => {
    this.baseAsset = new OrderFormAsset(baseAsset);
    this.quoteAsset = new OrderFormAsset(quoteAsset);

    const debouncedHandleAmountChange = debounce(this.handleAmountChange, 500) as (
      asset: OrderFormAsset,
    ) => Promise<void>;

    this.baseAsset.onAmountChange(debouncedHandleAmountChange);
    this.quoteAsset.onAmountChange(debouncedHandleAmountChange);

    const debouncedCalculateGasFee = debounce(this.calculateGasFee, 500) as () => Promise<void>;
    this.rangeLiquidity.onFieldChange(debouncedCalculateGasFee);

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

      assetOut.setAmount(pnum(output).toFormattedString(), false);
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

  calculateMarketGasFee = async (): Promise<void> => {
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

  constructRangePosition = ({
    positionIndex,
    positionUnitAmount,
  }: {
    positionIndex: number;
    positionUnitAmount: bigint;
  }) => {
    const baseAssetBaseUnits = this.baseAsset.toBaseUnits();
    const quoteAssetBaseUnits = this.quoteAsset.toBaseUnits();
    const { lowerBound, upperBound, positions, marketPrice, feeTier } = this
      .rangeLiquidity as Required<typeof this.rangeLiquidity>;

    const price =
      Number(lowerBound) +
      (positionIndex * (Number(upperBound) - Number(lowerBound))) / (positions ?? 1 - 1);
    const priceBaseUnits = pnum(price, this.quoteAsset.exponent ?? 0).toBigInt();

    // Cross-multiply exponents and prices for trading function coefficients
    //
    // We want to write
    // p = EndUnit * price
    // q = StartUnit
    // However, if EndUnit is too small, it might not round correctly after multiplying by price
    // To handle this, conditionally apply a scaling factor if the EndUnit amount is too small.
    const scale = quoteAssetBaseUnits < 1_000_000n ? 1_000_000n : 1n;
    const p = pnum(quoteAssetBaseUnits * scale * priceBaseUnits).toAmount();
    const q = pnum(baseAssetBaseUnits * scale).toAmount();

    // Compute reserves
    // Fund the position with asset 1 if its price exceeds the current price,
    // matching the target per-position amount of asset 2. Otherwise, fund with
    // asset 2 to avoid immediate arbitrage.
    const reserves =
      price < marketPrice
        ? {
            r1: pnum(0n).toAmount(),
            r2: pnum(positionUnitAmount).toAmount(),
          }
        : {
            r1: pnum(Number(positionUnitAmount) / price).toAmount(),
            r2: pnum(0n).toAmount(),
          };

    return {
      position: new Position({
        phi: {
          component: { fee: feeTier * 100, p, q },
          pair: new TradingPair({
            asset1: this.baseAsset.assetId,
            asset2: this.quoteAsset.assetId,
          }),
        },
        nonce: crypto.getRandomValues(new Uint8Array(32)),
        state: new PositionState({ state: PositionState_PositionStateEnum.OPENED }),
        reserves,
        closeOnFill: false,
      }),
    };
  };

  constructLimitPosition = () => {
    const baseAssetBaseUnits = this.baseAsset.toBaseUnits();
    const quoteAssetBaseUnits = this.quoteAsset.toBaseUnits();

    const { price, marketPrice } = this.limitOrder as Required<typeof this.limitOrder>;
    const priceNumber = Number(price);
    const priceUnitAmount = pnum(priceNumber, this.quoteAsset.exponent ?? 0).toBigInt();

    // Cross-multiply exponents and prices for trading function coefficients
    //
    // We want to write
    // p = EndUnit * price
    // q = StartUnit
    // However, if EndUnit is too small, it might not round correctly after multiplying by price
    // To handle this, conditionally apply a scaling factor if the EndUnit amount is too small.
    const scale = quoteAssetBaseUnits < 1_000_000n ? 1_000_000n : 1n;
    const p = pnum(quoteAssetBaseUnits * scale * priceUnitAmount).toAmount();
    const q = pnum(baseAssetBaseUnits * scale).toAmount();

    // Compute reserves
    // Fund the position with asset 1 if its price exceeds the current price,
    // matching the target per-position amount of asset 2. Otherwise, fund with
    // asset 2 to avoid immediate arbitrage.
    const reserves =
      priceNumber < marketPrice
        ? {
            r1: pnum(0n).toAmount(),
            r2: pnum(quoteAssetBaseUnits).toAmount(),
          }
        : {
            r1: pnum(Number(quoteAssetBaseUnits) / priceNumber).toAmount(),
            r2: pnum(0n).toAmount(),
          };

    return {
      position: new Position({
        phi: {
          component: { p, q },
          pair: new TradingPair({
            asset1: this.baseAsset.assetId,
            asset2: this.quoteAsset.assetId,
          }),
        },
        nonce: crypto.getRandomValues(new Uint8Array(32)),
        state: new PositionState({ state: PositionState_PositionStateEnum.OPENED }),
        reserves,
        closeOnFill: true,
      }),
    };
  };

  calculateRangeLiquidityGasFee = async (): Promise<void> => {
    this.gasFee = null;

    const { lowerBound, upperBound, positions, marketPrice, feeTier } = this.rangeLiquidity;
    if (
      !this.quoteAsset.amount ||
      !lowerBound ||
      !upperBound ||
      !positions ||
      !marketPrice ||
      !feeTier
    ) {
      this.gasFee = 0;
      return;
    }

    if (lowerBound > upperBound) {
      this.gasFee = 0;
      return;
    }

    const positionUnitAmount = this.quoteAsset.toBaseUnits() / BigInt(positions);
    const positionsReq = new TransactionPlannerRequest({
      positionOpens: times(positions, index =>
        this.constructRangePosition({
          positionIndex: index,
          positionUnitAmount,
        }),
      ),
      source: this.quoteAsset.accountIndex,
    });

    const txPlan = await plan(positionsReq);
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

  calculateGasFee = async (): Promise<void> => {
    if (this.type === FormType.Market) {
      await this.calculateMarketGasFee();
    }

    if (this.type === FormType.RangeLiquidity) {
      await this.calculateRangeLiquidityGasFee();
    }
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

  initiateLimitPositionTx = async (): Promise<void> => {
    try {
      this.isLoading = true;

      const { price } = this.limitOrder;
      if (!price) {
        openToast({
          type: 'error',
          message: 'Please enter a valid limit price.',
        });
        return;
      }

      const positionsReq = new TransactionPlannerRequest({
        positionOpens: [this.constructLimitPosition()],
        source: this.quoteAsset.accountIndex,
      });

      await planBuildBroadcast('positionOpen', positionsReq);

      this.baseAsset.unsetAmount();
      this.quoteAsset.unsetAmount();
    } finally {
      this.isLoading = false;
    }
  };

  // ref: https://github.com/penumbra-zone/penumbra/blob/main/crates/bin/pcli/src/command/tx/replicate/linear.rs
  initiateRangePositionsTx = async (): Promise<void> => {
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

      if (lowerBound > upperBound) {
        openToast({
          type: 'error',
          message: 'Upper bound must be greater than the lower bound.',
        });
        return;
      }

      const positionUnitAmount = this.quoteAsset.toBaseUnits() / BigInt(positions);
      const positionsReq = new TransactionPlannerRequest({
        positionOpens: times(positions, i =>
          this.constructRangePosition({
            positionIndex: i,
            positionUnitAmount,
          }),
        ),
        source: this.quoteAsset.accountIndex,
      });

      await planBuildBroadcast('positionOpen', positionsReq);

      this.baseAsset.unsetAmount();
      this.quoteAsset.unsetAmount();
    } finally {
      this.isLoading = false;
    }
  };

  submitOrder = (): void => {
    if (this.type === FormType.Market) {
      void this.initiateSwapTx();
    }

    if (this.type === FormType.Limit) {
      void this.initiateLimitPositionTx();
    }

    if (this.type === FormType.RangeLiquidity) {
      void this.initiateRangePositionsTx();
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
