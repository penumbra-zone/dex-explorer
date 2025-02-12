import { sql } from 'kysely';
import { bech32mPositionId } from '@penumbra-zone/bech32m/plpid';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import {
  AssetId,
  Metadata,
  ValueView,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { PositionId } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { pindexerDb } from '@/shared/database/client';
import { serialize, Serialized } from '@/shared/utils/serializer';
import { toValueView } from '@/shared/utils/value-view';

export const INTERVAL_FILTER = ['1h', '6h', '24h', '7d', '30d'] as const;
export type LeaderboardIntervalFilter = (typeof INTERVAL_FILTER)[number];
const intervalFilterToSQL: Record<LeaderboardIntervalFilter, string> = {
  '1h': '1 hour',
  '6h': '6 hours',
  '24h': '1 day',
  '7d': '1 week',
  '30d': '1 month',
};

const DEFAULT_INTERVAL: LeaderboardIntervalFilter = '7d';
const DEFAULT_LIMIT = 30;

export interface LeaderboardSearchParams {
  interval: LeaderboardIntervalFilter;
  limit: number;
  base?: string;
  quote?: string;
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

export interface LeaderboardPageInfo {
  data: LeaderboardData[];
  filters: LeaderboardSearchParams;
}

const getURLParams = (searchParams: URLSearchParams): LeaderboardSearchParams => {
  const limit = Number(searchParams.get('limit')) || DEFAULT_LIMIT;
  const base = searchParams.get('base') ?? undefined;
  const quote = searchParams.get('quote') ?? undefined;

  let interval =
    (searchParams.get('interval') as LeaderboardIntervalFilter | null) ?? DEFAULT_INTERVAL;
  interval = intervalFilterToSQL[interval] ? interval : DEFAULT_INTERVAL;

  return {
    limit,
    base,
    quote,
    interval,
  };
};

export const queryLeaderboard = async (
  params: URLSearchParams,
): Promise<Serialized<LeaderboardPageInfo | string>> => {
  const filters = getURLParams(params);

  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!chainId) {
    return serialize(new Error('Error: PENUMBRA_CHAIN_ID is not set'));
  }

  try {
    const registryClient = new ChainRegistryClient();
    const registry = await registryClient.remote.get(chainId);

    const positionExecutions = pindexerDb
      .selectFrom('dex_ex_position_executions')
      .select(exp => [
        'position_id',
        'context_asset_start',
        'context_asset_end',
        sql<number>`sum(${exp.ref('delta_1')} + ${exp.ref('lambda_1')})`.as('volume1'),
        sql<number>`sum(${exp.ref('delta_2')} + ${exp.ref('lambda_2')})`.as('volume2'),
        sql<number>`sum(${exp.ref('fee_1')})`.as('fees1'),
        sql<number>`sum(${exp.ref('fee_2')})`.as('fees2'),
        sql<number>`CAST(count(*) AS INTEGER)`.as('executionCount'),
      ])
      .groupBy(['position_id', 'context_asset_start', 'context_asset_end'])
      .orderBy('executionCount', 'desc');

    const results = await pindexerDb
      .selectFrom('dex_ex_position_state as state')
      .where(exp =>
        exp.and([
          exp.eb('closing_height', 'is', null),
          sql<boolean>`${exp.ref('state.opening_time')} >= NOW() - CAST(${intervalFilterToSQL[filters.interval]} AS INTERVAL)`,
        ]),
      )
      .innerJoin(positionExecutions.as('executions'), 'state.position_id', 'executions.position_id')
      .selectAll('executions')
      .limit(filters.limit)
      .execute();

    // TODO: merge dex_ex_position_executions with state table to receive initial data

    const mapped = await Promise.all(
      results.map(position => {
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
      }),
    );

    return serialize({
      filters,
      data: mapped.filter(Boolean) as LeaderboardData[],
    });
  } catch (error) {
    return serialize(error as Error);
  }
};
