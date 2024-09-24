import { BlockInfo } from '@/penumbra/block';
import { envPool, Pool } from './pool';

export type BlockQuery = { start?: number; end?: number } | { last: number } | undefined;

/**
 * A way to query information about blocks.
 *
 * This class has deliberately hidden its constructor to not bind to a particular
 * method of querying the database.
 * You can construct it by using {@link BlockQuerier.fromPool} or {@link BlockQuerier.fromEnv} instead.
 */
export class BlockQuerier {
  private constructor(private pool: Pool) {}

  /**
   * Use a specific pool to access the database.
   *
   * @param {Pool} pool our means of reading the database.
   */
  static fromPool(pool: Pool): BlockQuerier {
    return new BlockQuerier(pool);
  }

  /**
   * Use the ambient environment to figure out where the database is.
   */
  static fromEnv(): BlockQuerier {
    return BlockQuerier.fromPool(envPool());
  }

  /**
   * Query for block information.
   *
   * This either returns all blocks, the last N blocks, or a particular range.
   *
   * This will return at most 10000 blocks.
   */
  async blocks(query: BlockQuery): Promise<BlockInfo[]> {
    const MAX_BLOCKS = 10_000;
    const values =
      query && 'last' in query ? [null, null, query.last] : [query?.start, query?.end, null];
    const rows = await this.pool.query({
      text: `
        SELECT
          height::INT, timestamp
        FROM
          block_details
        WHERE
          ($1::BIGINT IS NULL OR height >= $1)
        AND
          ($2::BIGINT IS NULL or height <= $2)
        ORDER BY
          height DESC
        LIMIT
          LEAST($3::BIGINT, $4::BIGINT)
    `,
      rowMode: 'array',
      values: [...values, MAX_BLOCKS],
    });
    return rows.map(x => BlockInfo.DB_SCHEMA.parse(x));
  }
}
