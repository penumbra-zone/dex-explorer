import { Pool, envPool } from './pool.ts';

/** Represents the current state of a Liquidity Position. */
type LPState = 'opened' | 'closed' | 'withdrawn';

/**
 * Represents an update to a liquidity position.
 */
export class LPUpdate {
  private constructor(
    /** The unique identifier of this update, across all LPs. */
    public id: number,
    /** The block height where this update happened. */
    public height: number,
    /** The canonical identifier of the position being updated. */
    public positionId: string,
    /** The new state of the position. */
    public state: LPState,
    /** The new reserves of the first asset. */
    public reserves1: bigint,
    /** The new reserves of the second asset. */
    public reserves2: bigint,
  ) {}
}

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
