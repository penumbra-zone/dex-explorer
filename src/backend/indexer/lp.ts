import { LPUpdate } from '@/penumbra/dex.ts';
import { Pool, envPool } from './pool.ts';

/**
 * A class to query for information about liquidity positions.
 *
 * This class has deliberately hidden its constructor to not bind to a particular
 * method of querying the database.
 * You can construct it by using {@link LPQuerier.fromPool} or {@link LPQuerier.fromEnv} instead.
 */
export class LPQuerier {
  private constructor(private pool: Pool) {}

  /**
   * Use a specific pool to access the database.
   *
   * @param {Pool} pool our means of reading the database.
   */
  static fromPool(pool: Pool): LPQuerier {
    return new LPQuerier(pool);
  }

  /**
   * Use the ambient environment to figure out where the database is.
   */
  static fromEnv(): LPQuerier {
    return LPQuerier.fromPool(envPool());
  }

  /**
   * Return the first LP update from the database.
   */
  async firstLPUpdate(): Promise<LPUpdate> {
    const rows = await this.pool.query({
      text: `
        SELECT
          id::INTEGER,
          height::INTEGER,
          encode(position_id, 'base64'),
          state,
          reserves1::TEXT,
          reserves2::TEXT,
          (SELECT
            json_array(inflow1, inflow2, encode(context_start, 'base64'), encode(context_end, 'base64'))
           FROM
            dex_lp_execution
           WHERE
            dex_lp_execution.id = execution_id
           LIMIT 1
          )
        FROM dex_lp_update WHERE execution_id IS NOT NULL LIMIT 1
      `,
      rowMode: 'array',
    });
    return LPUpdate.dbSchema(false).parse(rows[0]);
  }
}
