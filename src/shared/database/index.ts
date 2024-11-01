import pkg from 'pg';
import fs from 'fs';
import { Kysely, PostgresDialect } from 'kysely';
import { DB } from '@/shared/database/schema.ts';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
const { Pool, types } = pkg;

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

export const db = new Kysely<DB>({ dialect });

const int8TypeId = 20;
// Map int8 to number.
types.setTypeParser(int8TypeId, val => {
  return BigInt(val);
});

export class Pindexer {
  static async summary(baseAsset: AssetId, quoteAsset: AssetId) {
    return db
      .selectFrom('dex_ex_summary')
      .selectAll()
      .where('asset_start', '=', Buffer.from(baseAsset.inner))
      .where('asset_end', '=', Buffer.from(quoteAsset.inner))
      .execute();
  }
}