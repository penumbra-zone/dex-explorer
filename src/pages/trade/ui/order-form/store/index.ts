import { useEffect } from 'react';
import { makeAutoObservable } from 'mobx';
import debounce from 'lodash/debounce';
import BigNumber from 'bignumber.js';
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
import { pnum } from '@penumbra-zone/types/pnum';
import { openToast } from '@penumbra-zone/ui/Toast';
import { penumbra } from '@/shared/const/penumbra';
import { useBalances } from '@/shared/api/balances';
import { plan, planBuildBroadcast } from '../helpers';
import { usePathToMetadata } from '../../../model/use-path';
import { OrderFormAsset } from './asset';
import { RangeLiquidity } from './range-liquidity';
import { LimitOrder } from './limit-order';
import { limitOrderPosition } from '@/shared/math/position';

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

    this.exchangeRate = pnum(output).toRoundedNumber();
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

    this.gasFee = pnum(feeValueView).toRoundedNumber();
  };

  // ref: https://github.com/penumbra-zone/penumbra/blob/main/crates/bin/pcli/src/command/tx/replicate/linear.rs
  buildLimitPosition = (): Position => {
    const { price } = this.limitOrder as Required<typeof this.limitOrder>;
    if (
      !this.baseAsset.assetId ||
      !this.quoteAsset.assetId ||
      !this.quoteAsset.exponent ||
      !this.baseAsset.exponent ||
      !this.quoteAsset.amount
    ) {
      throw new Error('incomplete limit position form');
    }
    return limitOrderPosition({
      buy: this.direction === 'Buy' ? 'buy' : 'sell',
      price: Number(price),
      baseAsset: {
        id: this.baseAsset.assetId,
        exponent: this.baseAsset.exponent,
      },
      quoteAsset: {
        id: this.quoteAsset.assetId,
        exponent: this.quoteAsset.exponent,
      },
      input:
        this.direction === 'Buy'
          ? Number(this.quoteAsset.amount)
          : Number(this.quoteAsset.amount) / Number(price),
    });
  };

  calculateGasFee = async (): Promise<void> => {
    if (this.type === FormType.Market) {
      await this.calculateMarketGasFee();
    }

    // if (this.type === FormType.RangeLiquidity) {
    //   await this.calculateRangeLiquidityGasFee();
    // }
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
        positionOpens: [
          {
            position: this.buildLimitPosition(),
          },
        ],
        source: this.quoteAsset.accountIndex,
      });

      await planBuildBroadcast('positionOpen', positionsReq);

      this.baseAsset.unsetAmount();
      this.quoteAsset.unsetAmount();
    } finally {
      this.isLoading = false;
    }
  };

  initiateRangePositionsTx = async (): Promise<void> => {
    try {
      this.isLoading = true;

      const { target, lowerBound, upperBound, positions, marketPrice, feeTier } =
        this.rangeLiquidity;

      if (!target || !lowerBound || !upperBound || !positions || !marketPrice || !feeTier) {
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

      const linearPositions = this.rangeLiquidity.buildPositions();
      const positionsReq = new TransactionPlannerRequest({
        positionOpens: linearPositions.map(position => ({ position })),
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
