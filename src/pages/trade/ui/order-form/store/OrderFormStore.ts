import { makeAutoObservable } from 'mobx';
import { LimitOrderFormStore } from './LimitOrderFormStore';
import { MarketOrderFormStore } from './MarketOrderFormStore';
import { RangeOrderFormStore } from './RangeOrderFormStore';
import { AssetInfo } from '@/pages/trade/model/AssetInfo';
import {
  BalancesResponse,
  TransactionPlannerRequest,
} from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { Address, AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { usePathToMetadata } from '@/pages/trade/model/use-path';
import { useBalances } from '@/shared/api/balances';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { connectionStore } from '@/shared/model/connection';
import { useSubaccounts } from '@/widgets/header/api/subaccounts';
import { useEffect } from 'react';
import { useMarketPrice } from '@/pages/trade/model/useMarketPrice';
import { planBuildBroadcast } from '../helpers';
import { getSwapCommitmentFromTx } from '@penumbra-zone/getters/transaction';

export type WhichForm = 'Market' | 'Limit' | 'Range';

export const isWhichForm = (x: string): x is WhichForm => {
  return x === 'Market' || x === 'Limit' || x === 'Range';
};

export class OrderFormStore {
  private _market = new MarketOrderFormStore();
  private _limit = new LimitOrderFormStore();
  private _range = new RangeOrderFormStore();
  private _whichForm: WhichForm = 'Market';
  private _submitting = false;
  private _marketPrice: number | undefined = undefined;
  address?: Address;
  subAccountIndex?: AddressIndex;

  constructor() {
    makeAutoObservable(this);
  }

  assetChange(base: AssetInfo, quote: AssetInfo) {
    this._market.assetChange(base, quote);
    this._limit.assetChange(base, quote);
    this._range.assetChange(base, quote);
  }

  set marketPrice(price: number) {
    this._marketPrice = price;
    this._range.marketPrice = price;
    this._limit.marketPrice = price;
  }

  get marketPrice(): number | undefined {
    return this._marketPrice;
  }

  set whichForm(x: WhichForm) {
    this._whichForm = x;
  }

  get whichForm(): WhichForm {
    return this._whichForm;
  }

  get marketForm() {
    return this._market;
  }

  get limitForm() {
    return this._limit;
  }

  get rangeForm() {
    return this._range;
  }

  get plan(): undefined | TransactionPlannerRequest {
    if (!this.address || !this.subAccountIndex) {
      return undefined;
    }
    if (this._whichForm === 'Market') {
      const plan = this._market.plan;
      if (!plan) {
        return undefined;
      }
      return new TransactionPlannerRequest({
        swaps: [{ targetAsset: plan.targetAsset, value: plan.value, claimAddress: this.address }],
        source: this.subAccountIndex,
      });
    }
    if (this._whichForm === 'Limit') {
      const plan = this._limit.plan;
      if (!plan) {
        return undefined;
      }
      return new TransactionPlannerRequest({
        positionOpens: [{ position: plan }],
        source: this.subAccountIndex,
      });
    }
    if (this._whichForm === 'Range') {
      const plan = this._range.plan;
      if (plan === undefined) {
        return undefined;
      }
      return new TransactionPlannerRequest({
        positionOpens: plan.map(x => ({ position: x })),
        source: this.subAccountIndex,
      });
    }
    return undefined;
  }

  get canSubmit(): boolean {
    return !this._submitting && this.plan !== undefined;
  }

  async submit() {
    const plan = this.plan;
    const wasSwap = this.whichForm === 'Market';
    const source = this.subAccountIndex;
    // Redundant, but makes typescript happier.
    if (!plan || !source) {
      return;
    }
    this._submitting = true;
    try {
      const tx = await planBuildBroadcast(wasSwap ? 'swap' : 'positionOpen', plan);
      if (!wasSwap || !tx) {
        return;
      }
      const swapCommitment = getSwapCommitmentFromTx(tx);
      const req = new TransactionPlannerRequest({
        swapClaims: [{ swapCommitment }],
        source,
      });
      await planBuildBroadcast('swapClaim', req, { skipAuth: true });
    } finally {
      this._submitting = false;
    }
  }
}

const pluckAssetBalance = (symbol: string, balances: BalancesResponse[]): undefined | Amount => {
  for (const balance of balances) {
    if (!balance.balanceView?.valueView || balance.balanceView.valueView.case !== 'knownAssetId') {
      continue;
    }
    if (balance.balanceView?.valueView.value.metadata?.symbol === symbol) {
      const amount = balance.balanceView?.valueView.value.amount;
      if (amount) {
        return amount;
      }
    }
  }
  return undefined;
};

const orderFormStore = new OrderFormStore();

export const useOrderFormStore = () => {
  const { baseAsset, quoteAsset } = usePathToMetadata();
  const { data: subAccounts } = useSubaccounts();
  const subAccount = subAccounts ? subAccounts[connectionStore.subaccount] : undefined;
  let addressIndex = undefined;
  let address = undefined;
  const addressView = subAccount?.addressView;
  if (addressView && addressView.case === 'decoded') {
    address = addressView.value.address;
    addressIndex = addressView.value.index;
  }
  const { data: balances } = useBalances(addressIndex);
  useEffect(() => {
    orderFormStore.subAccountIndex = addressIndex;
    orderFormStore.address = address;
    if (
      !baseAsset?.symbol ||
      !baseAsset?.penumbraAssetId ||
      !quoteAsset?.symbol ||
      !quoteAsset?.penumbraAssetId
    ) {
      return;
    }
    const baseBalance = balances && pluckAssetBalance(baseAsset.symbol, balances);
    const quoteBalance = balances && pluckAssetBalance(quoteAsset.symbol, balances);

    const baseAssetInfo = AssetInfo.fromMetadata(baseAsset, baseBalance);
    const quoteAssetInfo = AssetInfo.fromMetadata(quoteAsset, quoteBalance);
    if (baseAssetInfo && quoteAssetInfo) {
      orderFormStore.assetChange(baseAssetInfo, quoteAssetInfo);
      orderFormStore.subAccountIndex = addressIndex;
    }
  }, [orderFormStore, baseAsset, quoteAsset, balances, address, addressIndex]);

  const marketPrice = useMarketPrice();

  useEffect(() => {
    if (!marketPrice) {
      return;
    }
    orderFormStore.marketPrice = marketPrice;
  }, [orderFormStore, marketPrice]);
  return orderFormStore;
};
