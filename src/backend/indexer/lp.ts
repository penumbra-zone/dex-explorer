import { Pool, envPool } from './pool.ts';
import { z } from 'zod';

const LPState_ALL = ['opened', 'closed', 'withdrawn'] as const;
/** Represents the current state of a Liquidity Position. */
export type LPState = (typeof LPState_ALL)[number];

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

  /** How to parse this data from a database row. */
  private static DB_SCHEMA = z.tuple([
    z.number(),
    z.number(),
    z.string(),
    z.enum(LPState_ALL),
    z.coerce.bigint(),
    z.coerce.bigint(),
  ]);

  /** Parse this object from a database row. */
  static fromRow(row: unknown): LPUpdate {
    return new LPUpdate(...LPUpdate.DB_SCHEMA.parse(row));
  }

  /** Convert this object into JSON, encoding the big integers as strings. */
  toJSON(): string {
    return JSON.stringify({
      ...this,
      reserves1: this.reserves1.toString(),
      reserves2: this.reserves1.toString(),
    });
  }
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
          reserves2::TEXT 
        FROM dex_lp_update LIMIT 1
      `,
      rowMode: 'array',
    });
    return LPUpdate.fromRow(rows[0]);
  }
}
