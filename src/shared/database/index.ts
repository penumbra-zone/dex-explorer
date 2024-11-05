import pkg from 'pg';
import fs from 'fs';
import { Kysely, PostgresDialect } from 'kysely';
import { DB } from '@/shared/database/schema.ts';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
const { Pool, types } = pkg;

class Pindexer {
  private db: Kysely<DB>;

  constructor() {
    const ca = process.env['PENUMBRA_INDEXER_CA_CERT'];
    const connectionString = process.env['PENUMBRA_INDEXER_ENDPOINT'];
    const dbConfig = {
      connectionString: connectionString,
      ...(ca && {
        ssl: {
          rejectUnauthorized: true,
          ca: ca.startsWith('-----BEGIN CERTIFICATE-----') ? ca : fs.readFileSync(ca, 'utf-8'),
        },
      }),
    };
    const dialect = new PostgresDialect({
      pool: new Pool(dbConfig),
    });

    this.db = new Kysely<DB>({ dialect });

    const int8TypeId = 20;
    // Map int8 to number.
    types.setTypeParser(int8TypeId, val => {
      return BigInt(val);
    });
  }

  async summary(baseAsset: AssetId, quoteAsset: AssetId) {
    return this.db
      .selectFrom('dex_ex_summary')
      .selectAll()
      .where('asset_start', '=', Buffer.from(baseAsset.inner))
      .where('asset_end', '=', Buffer.from(quoteAsset.inner))
      .execute();
  }

  async candles(baseAsset: AssetId, quoteAsset: AssetId, start: Date, end: Date) {
    return this.db
      .selectFrom('dex_ex_price_charts')
      .innerJoin('dex_ex_candlesticks', 'candlestick_id', 'dex_ex_candlesticks.id')
      .select(['start_time', 'open', 'close', 'low', 'high', 'swap_volume', 'direct_volume'])
      .where('the_window', '=', '1d')
      .where('asset_start', '=', Buffer.from(baseAsset.inner))
      .where('asset_end', '=', Buffer.from(quoteAsset.inner))
      .where('start_time', '<', start)
      .where('start_time', '>=', end)
      .execute();
  }
}

export const pindexer = new Pindexer();
