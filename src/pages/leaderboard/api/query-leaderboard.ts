import { sql } from 'kysely';
import { bech32mPositionId } from '@penumbra-zone/bech32m/plpid';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { AssetId, Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { PositionId } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { pindexerDb } from '@/shared/database/client';
import { serialize, Serialized } from '@/shared/utils/serializer';
import { toValueView } from '@/shared/utils/value-view';

export interface LeaderboardSearchParams {
  limit: number;
}

export interface LeaderboardData {
  asset1: Metadata;
  asset2: Metadata;
  positionId: string;
  volume1: ValueView;
  volume2: ValueView;
  fees1: ValueView;
  fees2: ValueView;
  executions: number;
}

const getURLParams = (searchParams: URLSearchParams): LeaderboardSearchParams => {
  const limit = Number(searchParams.get('limit')) || 30;
  return {
    limit,
  };
};

export const queryLeaderboard = async (params: URLSearchParams): Promise<Serialized<LeaderboardData[] | Error>> => {
  const { limit } = getURLParams(params);

  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!chainId) {
    return serialize(new Error('Error: PENUMBRA_CHAIN_ID is not set'));
  }

  try {
    const registryClient = new ChainRegistryClient();
    const registry = await registryClient.remote.get(chainId);

    const results = await pindexerDb
      .selectFrom('dex_ex_position_executions')
      .select((exp) => ([
        'position_id',
        'context_asset_start',
        'context_asset_end',
        sql<number>`sum(${exp.ref('delta_1')} + ${exp.ref('lambda_1')})`.as('volume1'),
        sql<number>`sum(${exp.ref('delta_2')} + ${exp.ref('lambda_2')})`.as('volume2'),
        sql<number>`sum(${exp.ref('fee_1')})`.as('fees1'),
        sql<number>`sum(${exp.ref('fee_2')})`.as('fees2'),
        sql<number>`CAST(count(*) AS INTEGER)`.as('executionCount'),
      ]))
      .groupBy(['position_id', 'context_asset_start', 'context_asset_end'])
      .orderBy('executionCount', 'desc')
      .limit(limit)
      .execute();

    // TODO: merge dex_ex_position_executions with state table to receive initial data

    const mapped = await Promise.all(results.map((position) => {
      const asset1 = new AssetId({ inner: position.context_asset_start });
      const asset2 = new AssetId({ inner: position.context_asset_end });
      const metadata1 = registry.tryGetMetadata(asset1);
      const metadata2 = registry.tryGetMetadata(asset2);

      if (!metadata1 || !metadata2) {
        return undefined;
      }

      return {
        asset1: metadata1,
        asset2: metadata2,
        executions: position.executionCount,
        positionId: bech32mPositionId(new PositionId({ inner: position.position_id })),
        volume1: toValueView({
          amount: position.volume1,
          metadata: metadata1,
        }),
        volume2: toValueView({
          amount: position.volume2,
          metadata: metadata2,
        }),
        fees1: toValueView({
          amount: position.fees1,
          metadata: metadata1,
        }),
        fees2: toValueView({
          amount: position.fees2,
          metadata: metadata2,
        }),
      };
    }));

    return serialize(mapped.filter(Boolean) as LeaderboardData[]);
  } catch (error) {
    return serialize(error as Error);
  }
};
