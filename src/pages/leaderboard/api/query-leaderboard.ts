import { pindexerDb } from '@/shared/database/client';
import { sql } from 'kysely';

export const queryLeaderboard = async (limit: number, interval: string) => {
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

  return pindexerDb
    .selectFrom('dex_ex_position_state as state')
    .where(exp =>
      exp.and([
        exp.eb('closing_height', 'is', null),
        sql<boolean>`${exp.ref('state.opening_time')} >= NOW() - CAST(${interval} AS INTERVAL)`,
      ]),
    )
    .innerJoin(positionExecutions.as('executions'), 'state.position_id', 'executions.position_id')
    .selectAll('executions')
    .limit(limit)
    .execute();
};
