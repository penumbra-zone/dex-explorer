import { DexService, ViewService } from '@penumbra-zone/protobuf';
import { penumbra } from '@/shared/const/penumbra';
import { connectionStore } from '@/shared/model/connection';
import { useQuery } from '@tanstack/react-query';
import {
  Position,
  PositionId,
  PositionState_PositionStateEnum,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { AssetId, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { bech32mPositionId } from '@penumbra-zone/bech32m/plpid';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { chainRegistryClient } from '@/shared/api/registry.ts';

interface PositionData {
  positionId: string;
  positionState: PositionStateStr;
  fee: number;
  asset1: ValueView;
  asset2: ValueView;
}

const assetIdToValueView = async (assetId?: AssetId, amount?: Amount) => {
  if (!assetId) {
    throw new Error('No asset id found to convert to ValueView');
  }

  // const registry = await registryQueryFn();
  const registry = await chainRegistryClient.remote.get('penumbra-testnet-phobos-2');
  const metadata = registry.tryGetMetadata(assetId);
  if (!metadata) {
    return new ValueView({
      valueView: { case: 'knownAssetId', value: { amount, metadata } },
    });
  } else {
    return new ValueView({
      valueView: { case: 'unknownAssetId', value: { amount, assetId } },
    });
  }
};

const positionToDisplayData = async (id: PositionId, position: Position): Promise<PositionData> => {
  const asset1Id = position.phi?.pair?.asset1;
  const asset1Amount = position.reserves?.r1;

  const asset2Id = position.phi?.pair?.asset2;
  const asset2Amount = position.reserves?.r2;

  return {
    positionId: bech32mPositionId(id),
    positionState: stateToString(position.state?.state),
    fee: position.phi?.component?.fee ?? 0,
    asset1: await assetIdToValueView(asset1Id, asset1Amount),
    asset2: await assetIdToValueView(asset2Id, asset2Amount),
  };
};

// 1) Query prax to get position ids
// 2) Take those position ids and get position info from the node
// Context on two-step fetching process: https://github.com/penumbra-zone/penumbra/pull/4837
const fetchQuery = async (): Promise<PositionData[]> => {
  const ownedRes = await Array.fromAsync(penumbra.service(ViewService).ownedPositionIds({}));
  const positionIds = ownedRes.map(r => r.positionId).filter(Boolean) as PositionId[];

  const positionsRes = await Array.fromAsync(
    penumbra.service(DexService).liquidityPositionsById({ positionId: positionIds }),
  );
  if (positionsRes.length !== ownedRes.length) {
    throw new Error('owned id array does not match the length of the positions response');
  }
  const positions = positionsRes.map(r => r.data).filter(Boolean) as Position[];

  const positionData: PositionData[] = [];
  // The responses are in the same order as the requests. Hence, the index matching.
  for (let i = 0; i < positions.length; i++) {
    const id = positionIds[i];
    const position = positions[i];
    if (!id || !position) {
      throw new Error(`No corresponding position or id for index ${i}`);
    }
    const data = await positionToDisplayData(id, position);
    positionData.push(data);
  }

  return positionData;
};

/**
 * Must be used within the `observer` mobX HOC
 */
export const usePositions = () => {
  return useQuery({
    queryKey: ['positions'],
    queryFn: fetchQuery,
    enabled: connectionStore.connected,
  });
};

type PositionStateStr = 'UNSPECIFIED' | 'OPENED' | 'CLOSED' | 'WITHDRAWN' | 'CLAIMED';

export const stateToString = (state?: PositionState_PositionStateEnum): PositionStateStr => {
  switch (state) {
    case PositionState_PositionStateEnum.UNSPECIFIED: {
      return 'UNSPECIFIED';
    }
    case PositionState_PositionStateEnum.OPENED: {
      return 'OPENED';
    }
    case PositionState_PositionStateEnum.CLOSED: {
      return 'CLOSED';
    }
    case PositionState_PositionStateEnum.WITHDRAWN: {
      return 'WITHDRAWN';
    }
    case PositionState_PositionStateEnum.CLAIMED: {
      return 'CLAIMED';
    }
    case undefined: {
      return 'UNSPECIFIED';
    }
  }
};
