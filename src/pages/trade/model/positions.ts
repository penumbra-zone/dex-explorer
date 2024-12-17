import { makeAutoObservable } from 'mobx';
import { TransactionPlannerRequest } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import {
  Position,
  PositionId,
  PositionState_PositionStateEnum,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { planBuildBroadcast } from '@/pages/trade/ui/order-form/helpers.tsx';
import { connectionStore } from '@/shared/model/connection';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { queryClient } from '@/shared/const/queryClient.ts';
import { getPositionData, PositionData } from '@/pages/trade/api/positions.ts';
import { penumbra } from '@/shared/const/penumbra.ts';
import { DexService } from '@penumbra-zone/protobuf';
import { openToast } from '@penumbra-zone/ui/Toast';
import { bech32mPositionId } from '@penumbra-zone/bech32m/plpid';
import { pnum } from '@penumbra-zone/types/pnum';
import { compareAssetId, pqToPrice } from '@/shared/math/position';
import { registryQueryFn } from '@/shared/api/registry';

class PositionsStore {
  public loading = false;
  public positionsById: Record<string, Position> = {};
  private assets: Metadata[];

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
    console.log('TCL: PositionsStore -> setAssets -> assets', assets);
    this.assets = assets;
  };

  get displayPositions() {
    if (!this.assets) {
      return [];
    }

    return Object.entries(this.positionsById).map(([id, position]) => {
      console.log('TCL: PositionsStore -> getdisplayPositions -> position', position);

      const { pair, component } = position.phi;
      const asset1 = this.assets.find(x => x.penumbraAssetId.equals(pair?.asset1));
      console.log('TCL: PositionsStore -> getdisplayPositions -> asset1', asset1);
      const asset2 = this.assets.find(x => x.penumbraAssetId.equals(pair?.asset2));
      console.log('TCL: PositionsStore -> getdisplayPositions -> asset2', asset2);

      const correctOrder = compareAssetId(pair?.asset1, pair?.asset2) <= 0;
      const [[p, q], [r1, r2], [a1, a2]] = correctOrder
        ? [
            [component?.p, component?.q],
            [component?.r1, component?.r2],
            [pair?.asset1, pair?.asset2],
          ]
        : [
            [component?.q, component?.p],
            [component?.r2, component?.r1],
            [pair?.asset2, pair?.asset1],
          ];

      const a1Exponent = a1.denomUnits?.find(x => x.denom === a1.display)?.exponent;
      const a2Exponent = a2.denomUnits?.find(x => x.denom === a2.display)?.exponent;

      return {
        id,
        type: 'buy',
        amount: '',
        basePrice: pqToPrice(p, q, a1Exponent, a2Exponent),
        effectivePrice: pqToPrice(p, q, a1Exponent, a2Exponent),
        fee: `${pnum(component?.fee).toFormattedString()}%`,
        currentValue: '',
        // isActive: position.positionState !== PositionState_PositionStateEnum.WITHDRAWN,
      };
    });
  }
}

export const positionsStore = new PositionsStore();
