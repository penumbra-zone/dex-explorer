import { makeAutoObservable } from 'mobx';
import { TransactionPlannerRequest } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import {
  Position,
  PositionId,
  PositionState_PositionStateEnum,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { planBuildBroadcast } from '@/pages/trade/ui/order-form/helpers.tsx';
import { connectionStore } from '@/shared/model/connection';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { queryClient } from '@/shared/const/queryClient.ts';
import { getPositionData, PositionData, stateToString } from '@/pages/trade/api/positions.ts';
import { penumbra } from '@/shared/const/penumbra.ts';
import { DexService } from '@penumbra-zone/protobuf';
import { openToast } from '@penumbra-zone/ui/Toast';
import { pnum } from '@penumbra-zone/types/pnum';

export interface DisplayPosition {
  id: string;
  positionId: PositionId;
  direction: string;
  amount: ValueView;
  basePrice: ValueView;
  effectivePrice: ValueView;
  baseAsset: Metadata;
  quoteAsset: Metadata;
}

export interface DisplayAsset {
  asset: Metadata;
  exponent: number;
  amount: number;
  price: number;
  effectivePrice: number;
  reserves: Amount;
}

class PositionsStore {
  public loading = false;
  public positionsById: Record<string, Position> = {};
  private assets: Metadata[] = [];
  private currentPair: [Metadata, Metadata] | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setLoading(state: boolean) {
    this.loading = state;
  }

  closePositions = async (positions: PositionId[]): Promise<void> => {
    try {
      this.setLoading(true);

      const planReq = new TransactionPlannerRequest({
        positionCloses: positions.map(positionId => ({ positionId })),
        source: new AddressIndex({ account: connectionStore.subaccount }),
      });

      await planBuildBroadcast('positionClose', planReq);
      await this.updatePositionsInCache(positions);
    } catch (e) {
      openToast({
        type: 'error',
        message: 'Error with withdraw action',
        description: String(e),
      });
    } finally {
      this.setLoading(false);
    }
  };

  withdrawPositions = async (positions: PositionId[]): Promise<void> => {
    try {
      this.setLoading(true);

      // Fetching latest position data as the planner request requires current reserves + pair
      const promises = positions.map(positionId =>
        penumbra.service(DexService).liquidityPositionById({ positionId }),
      );
      const latestPositionData = await Promise.all(promises);

      const planReq = new TransactionPlannerRequest({
        positionWithdraws: positions.map((positionId, i) => ({
          positionId,
          tradingPair: latestPositionData[i]?.data?.phi?.pair,
          reserves: latestPositionData[i]?.data?.reserves,
        })),
        source: new AddressIndex({ account: connectionStore.subaccount }),
      });

      await planBuildBroadcast('positionWithdraw', planReq);
      await this.updatePositionsInCache(positions);
    } catch (e) {
      openToast({
        type: 'error',
        message: 'Error with withdraw action',
        description: String(e),
      });
    } finally {
      this.setLoading(false);
    }
  };

  private async updatePositionsInCache(positions: PositionId[]): Promise<void> {
    const promises = positions.map(id => this.updatePositionInCache(id));
    await Promise.all(promises);
  }

  // After a successful action, update the position state in the cache
  private async updatePositionInCache(positionId: PositionId) {
    const { data } = await penumbra.service(DexService).liquidityPositionById({ positionId });
    if (data) {
      const newPositionData = await getPositionData(positionId, data);
      queryClient.setQueryData<PositionData[]>(['positions'], oldData => {
        if (!oldData) {
          throw new Error('Trying to update position data cache when none is present');
        }
        // Finding matching positionId and swap out the position data with latest
        return oldData.map(p => (p.positionId === positionId ? newPositionData : p));
      });
    }
  }

  setPositions = (positionsById: Record<string, Position>) => {
    this.positionsById = positionsById;
  };

  setAssets = (assets: Metadata[]) => {
    this.assets = assets;
  };

  setCurrentPair = (baseAsset: Metadata, quoteAsset: Metadata) => {
    this.currentPair = [baseAsset, quoteAsset];
  };

  getDirection = (baseReserves: Amount, quoteReserves: Amount) => {
    if (pnum(baseReserves).toBigInt() !== 0n && pnum(quoteReserves).toBigInt() !== 0n) {
      return 'Sell';
    }

    if (pnum(baseReserves).toBigInt() !== 0n) {
      return 'Sell';
    }

    // else quoteReserves !== 0n
    return 'Buy';
  };

  getDirectionalPositionInfo = ({
    asset1,
    asset2,
  }: {
    asset1: {
      asset: Metadata;
      exponent: number;
      amount: number;
      price: number;
      effectivePrice: number;
      reserves: Amount;
    };
    asset2: {
      asset: Metadata;
      exponent: number;
      amount: number;
      price: number;
      effectivePrice: number;
      reserves: Amount;
    };
  }): { direction: string; baseAsset: DisplayAsset; quoteAsset: DisplayAsset } => {
    if (!this.currentPair || !asset1.asset.penumbraAssetId || !asset2.asset.penumbraAssetId) {
      throw new Error('No current pair or assets');
    }

    const [currentBaseAsset, currentQuoteAsset] = this.currentPair;
    const asset1IsBaseAsset = asset1.asset.penumbraAssetId.equals(currentBaseAsset.penumbraAssetId);
    const asset1IsQuoteAsset = asset1.asset.penumbraAssetId.equals(
      currentQuoteAsset.penumbraAssetId,
    );
    const asset2IsBaseAsset = asset2.asset.penumbraAssetId.equals(currentBaseAsset.penumbraAssetId);
    const asset2IsQuoteAsset = asset2.asset.penumbraAssetId.equals(
      currentQuoteAsset.penumbraAssetId,
    );

    // - if position in current pair, use the current orientation
    if (asset1IsBaseAsset && asset2IsQuoteAsset) {
      return {
        direction: this.getDirection(asset1.reserves, asset2.reserves),
        baseAsset: asset1,
        quoteAsset: asset2,
      };
    }

    if (asset1IsQuoteAsset && asset2IsBaseAsset) {
      return {
        direction: this.getDirection(asset2.reserves, asset1.reserves),
        baseAsset: asset2,
        quoteAsset: asset1,
      };
    }

    // - if position not in current pair, and one asset in position
    //   pair is the current view’s quote asset, use that asset as
    //   the quote asset
    if (asset1IsQuoteAsset) {
      return {
        direction: this.getDirection(asset2.reserves, asset1.reserves),
        baseAsset: asset2,
        quoteAsset: asset1,
      };
    }

    if (asset2IsQuoteAsset) {
      return {
        direction: this.getDirection(asset1.reserves, asset2.reserves),
        baseAsset: asset1,
        quoteAsset: asset2,
      };
    }

    // - otherwise use whatever ordering
    return {
      direction: this.getDirection(asset1.reserves, asset2.reserves),
      baseAsset: asset1,
      quoteAsset: asset2,
    };
  };

  get displayPositions(): DisplayPosition[] {
    if (!this.assets.length || !this.currentPair) {
      return [];
    }

    return Object.entries(this.positionsById)
      .map(([id, position]) => {
        /* eslint-disable curly -- makes code more concise */
        const { phi, reserves, state } = position;
        if (!phi || !reserves?.r1 || !reserves.r2 || !state) return;

        const { pair, component } = phi;
        if (!pair || !component?.p || !component.q) return;

        const asset1 = this.assets.find(asset => asset.penumbraAssetId?.equals(pair.asset1));
        const asset2 = this.assets.find(asset => asset.penumbraAssetId?.equals(pair.asset2));
        if (!asset1?.penumbraAssetId || !asset2?.penumbraAssetId) return;

        const asset1Exponent = asset1.denomUnits.find(
          denumUnit => denumUnit.denom === asset1.display,
        )?.exponent;
        const asset2Exponent = asset2.denomUnits.find(
          denumUnit => denumUnit.denom === asset2.display,
        )?.exponent;
        if (!asset1Exponent || !asset2Exponent) return;

        const { p, q } = component;
        const { r1, r2 } = reserves;
        const asset1Price = pnum(p).toBigNumber().dividedBy(pnum(q).toBigNumber()).toNumber();
        const asset2Price = pnum(q).toBigNumber().dividedBy(pnum(p).toBigNumber()).toNumber();
        const asset1Amount = pnum(r1, asset1Exponent).toNumber();
        const asset2Amount = pnum(r2, asset2Exponent).toNumber();

        // but clearly, this measure of price is insufficient because if two
        // positions have the same coefficients but one quote a 100% fee and
        // the other a 0% fee, they have in fact very different prices. how do
        // we get a measure of price that includes this information?

        // this is what the effective price is for:
        // effective exchange rate between asset 1 and asset 2: (p_1/p_2)*gamma
        // p1 / (p2 * gamma) ?
        //
        // asset 2 to asset 1: (p_2 * gamma)/p_1
        const gamma = (10_000 - component.fee) / 10_000;
        const asset1EffectivePrice = pnum(p)
          .toBigNumber()
          .dividedBy(pnum(q).toBigNumber().times(pnum(gamma).toBigNumber()))
          .toNumber();

        const asset2EffectivePrice = pnum(q)
          .toBigNumber()
          .times(pnum(gamma).toBigNumber())
          .dividedBy(pnum(p).toBigNumber())
          .toNumber();

        const { direction, baseAsset, quoteAsset } = this.getDirectionalPositionInfo({
          asset1: {
            asset: asset1,
            exponent: asset1Exponent,
            amount: asset1Amount,
            price: asset1Price,
            effectivePrice: asset1EffectivePrice,
            reserves: reserves.r1,
          },
          asset2: {
            asset: asset2,
            exponent: asset2Exponent,
            amount: asset2Amount,
            price: asset2Price,
            effectivePrice: asset2EffectivePrice,
            reserves: reserves.r2,
          },
        });

        return {
          id,
          positionId: position.positionId,
          direction,
          amount:
            direction === 'Sell'
              ? pnum(baseAsset.amount, baseAsset.exponent).toValueView(baseAsset.asset)
              : pnum(quoteAsset.amount, quoteAsset.exponent).toValueView(quoteAsset.asset),
          basePrice: pnum(quoteAsset.price, quoteAsset.exponent).toValueView(quoteAsset.asset),
          effectivePrice: pnum(quoteAsset.effectivePrice, quoteAsset.exponent).toValueView(
            quoteAsset.asset,
          ),
          baseAsset,
          quoteAsset,
          fee: `${pnum(component.fee / 100).toFormattedString({ decimals: 2 })}%`,
          isActive: state.state !== PositionState_PositionStateEnum.WITHDRAWN,
          state: state.state,
          stateString: stateToString(state.state),
        };
      })
      .filter(Boolean);
  }
}

export const positionsStore = new PositionsStore();
