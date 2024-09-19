import { Pool as PgPool } from 'pg';

/**
 * Represents a connection pool to a postegres database.
 */
export class Pool {
  private pool: PgPool;

  constructor(connectionString: string) {
    this.pool = new PgPool({ connectionString });
  }

  async query(text: string, values: unknown[]): Promise<unknown[]> {
    return (await this.pool.query(text, values)).rows as unknown[];
  }
}

/**
 * A waterpark is a collection of pools.
 *
 * By using a global waterpark we can cache pool creation.
 */
export class Waterpark {
  private pools: Map<string, Pool> = new Map<string, Pool>();

  /**
   * Add a new pool to the park.
   *
   * This will have no effect if the same connection string is used twice.
   *
   * @param connectionString tells us how to connect to a database.
   */
  pool(connectionString: string): Pool {
    let pool = this.pools.get(connectionString);
    if (!pool) {
      pool = new Pool(connectionString);
      this.pools.set(connectionString, pool);
    }
    return pool;
  }
}

/** A static waterpark to use to make pools. */
export const A_WATERPARK: Waterpark = new Waterpark();

/**
 * Create a pool in the default watermark using the environments connection string.
 */
export function envPool(waterpark = A_WATERPARK): Pool {
  const connectionString = process.env['PENUMBRA_INDEXER'];
  if (!connectionString) {
    throw new Error('PENUMBRA_INDEXER is not set');
  }
  return waterpark.pool(connectionString);
}
