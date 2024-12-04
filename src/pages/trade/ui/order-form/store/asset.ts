import { makeAutoObservable } from 'mobx';
import {
  AssetId,
  Metadata,
  Value,
  ValueView,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { getAssetId, getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { getAddressIndex, getAddress } from '@penumbra-zone/getters/address-view';
import { getFormattedAmtFromValueView } from '@penumbra-zone/types/value-view';
import { LoHi } from '@penumbra-zone/types/lo-hi';
import {
  AddressView,
  Address,
  AddressIndex,
} from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { pnum } from '../pnum';

export class OrderFormAsset {
  metadata?: Metadata;
  balanceView?: ValueView;
  addressView?: AddressView;
  amount?: number | string;
  onAmountChangeCallback?: (asset: OrderFormAsset) => Promise<void>;
  isEstimating = false;

  constructor(metadata?: Metadata) {
    makeAutoObservable(this);

    this.metadata = metadata;
  }

  setBalanceView = (balanceView: ValueView): void => {
    this.balanceView = balanceView;
  };

  setAccountAddress = (addressView: AddressView): void => {
    this.addressView = addressView;
  };

  get accountAddress(): Address | undefined {
    return this.addressView ? getAddress(this.addressView) : undefined;
  }

  get accountIndex(): AddressIndex | undefined {
    return this.addressView ? getAddressIndex(this.addressView) : undefined;
  }

  get assetId(): AssetId | undefined {
    return this.metadata ? getAssetId(this.metadata) : undefined;
  }

  get exponent(): number | undefined {
    return this.metadata ? getDisplayDenomExponent(this.metadata) : undefined;
  }

  get balance(): number | undefined {
    if (!this.balanceView) {
      return undefined;
    }

    const balance = getFormattedAmtFromValueView(this.balanceView, true);
    return parseFloat(balance.replace(/,/g, ''));
  }

  get symbol(): string {
    return this.metadata?.symbol ?? '';
  }

  setAmount = (amount: string | number, callOnAmountChange = true): void => {
    if (this.amount !== amount) {
      this.amount = amount;

      if (this.onAmountChangeCallback && callOnAmountChange) {
        void this.onAmountChangeCallback(this);
      }
    }
  };

  unsetAmount = (): void => {
    this.amount = undefined;
    this.isEstimating = false;
  };

  setIsEstimating = (isEstimating: boolean): void => {
    this.isEstimating = isEstimating;
  };

  onAmountChange = (callback: (asset: OrderFormAsset) => Promise<void>): void => {
    this.onAmountChangeCallback = callback;
  };

  toLoHi = (): LoHi => {
    return pnum(this.amount, this.exponent).toLoHi();
  };

  toBaseUnits = (): bigint => {
    return pnum(this.amount, this.exponent).toBigInt();
  };

  toValue = (): Value => {
    return new Value({
      assetId: this.assetId,
      amount: this.toLoHi(),
    });
  };
}
