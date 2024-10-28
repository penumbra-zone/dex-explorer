import { makeAutoObservable } from 'mobx';
import { TransactionPlannerRequest } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
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

class OrderFormStore {
  type: OrderType = OrderType.Swap;
  direction: Direction = Direction.Buy;
  assetIn: Metadata | undefined;
  assetOut: Metadata | undefined;
  assetInAmount: string = '';
  assetOutAmount: string = '';
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

  setAssetIn = (asset: Metadata): void => {
    this.assetIn = asset;
  };

  setAssetInAmount = (amount: string): void => {
    this.assetInAmount = amount;
  };

  setAssetOut = (asset: Metadata): void => {
    this.assetOut = asset;
  };

  setAssetOutAmount = (amount: string): void => {
    this.assetOutAmount = amount;
  };

  submitOrder = (): void => {
    console.log('TCL: OrderFormStore -> submitOrder');
  };

  setIsLoading = (isLoading: boolean): void => {
    this.isLoading = isLoading;
  };
}

export const orderFormStore = new OrderFormStore();
