import { sql } from 'kysely';
import { pindexerDb } from '@/shared/database/client';

export const queryLeaderboard = async (limit: number) => {
  const results = await pindexerDb
    .selectFrom('dex_ex_position_executions')
    .select((exp) => ([
      // 'context_asset_end',
      // 'context_asset_start',
      // exp.fn.sum(exp.ref('delta_1'), exp.ref('lambda_1')).as('volume1'),
      'position_id',
      sql<string>`sum(${exp.ref('delta_1')} + ${exp.ref('lambda_1')})`.as('volume1'),
      sql<string>`sum(${exp.ref('delta_2')} + ${exp.ref('lambda_2')})`.as('volume2'),
      sql<string>`sum(${exp.ref('fee_1')})`.as('fees1'),
      sql<string>`sum(${exp.ref('fee_2')})`.as('fees2'),
      sql<number>`CAST(count(*) AS INTEGER)`.as('executionCount'),
    ]))
    .groupBy(['position_id'])
    .orderBy('executionCount', 'desc')
    .limit(limit)
    .execute();

  return results;
};

type FromPromise<T> = T extends Promise<(infer U)[]> ? U : T;
export type LeaderboardData = FromPromise<ReturnType<typeof queryLeaderboard>>;
