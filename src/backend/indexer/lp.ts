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
   * A test function.
   *
   * TODO: delete me.
   */
  async test(): Promise<unknown[]> {
    return await this.pool.query(
      'SELECT * FROM dex_lp_update JOIN block_details ON dex_lp_update.height = block_details.height LIMIT 1',
      [],
    );
  }
}
