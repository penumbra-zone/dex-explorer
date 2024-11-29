import { Pool, types } from 'pg';
import fs from 'fs';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { DurationWindow } from '@/shared/utils/duration.ts';
import { DB, DexExAggregateSummary } from './schema';

const MAINNET_CHAIN_ID = 'penumbra-1';

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

  async summary(window: DurationWindow, baseAsset: AssetId, quoteAsset: AssetId) {
    return this.db
      .selectFrom('dex_ex_pairs_summary')
      .selectAll()
      .where('the_window', '=', window)
      .where('asset_start', '=', Buffer.from(baseAsset.inner))
      .where('asset_end', '=', Buffer.from(quoteAsset.inner))
      .execute();
  }

  async stats(window: DurationWindow): Promise<DexExAggregateSummary[]> {
    return this.db
      .selectFrom('dex_ex_aggregate_summary')
      .selectAll()
      .where('the_window', '=', window)
      .execute();
  }

  async candles({
    baseAsset,
    quoteAsset,
    window,
    chainId,
  }: {
    baseAsset: AssetId;
    quoteAsset: AssetId;
    window: DurationWindow;
    chainId: string;
  }) {
    let query = this.db
      .selectFrom('dex_ex_price_charts')
      .select(['start_time', 'open', 'close', 'low', 'high', 'swap_volume', 'direct_volume'])
      .where('the_window', '=', window)
      .where('asset_start', '=', Buffer.from(baseAsset.inner))
      .where('asset_end', '=', Buffer.from(quoteAsset.inner))
      .orderBy('start_time', 'asc');

    // Due to a lot of price volatility at the launch of the chain, manually setting start date a few days later
    if (chainId === MAINNET_CHAIN_ID) {
      query = query.where('start_time', '>=', new Date('2024-08-06'));
    }

    return query.execute();
  }

  // Paginated pair summaries
  async summaries({
    window,
    limit,
    offset,
  }: {
    window: DurationWindow;
    limit: number;
    offset: number;
  }) {
    // Selects only distinct pairs (USDT/USDC, but not reverse) with its data
    const summaryTable = this.db
      .selectFrom('dex_ex_pairs_summary')
      .distinctOn(sql<string>`least(asset_start, asset_end), greatest(asset_start, asset_end)`)
      .selectAll()
      .where('the_window', '=', window)
      .where('price', '!=', 0);

    /*
      TODO: fix candles returning an array of 1 always
     */

    // Selects 1h-candles for the last 24 hours and aggregates them into a single array, ordering by assets
    const candlesTable = this.db
      .selectFrom('dex_ex_price_charts')
      .select(exp => [
        'asset_end',
        'asset_start',
        // ARRAY_AGG(close ORDER BY start_time ASC) AS close -- produce a single array
        sql<number[]>`array_agg(${exp.ref('close')} ORDER BY start_time ASC)`.as('candles'),
      ])
      .where(exp =>
        exp.and([
          exp.eb('the_window', '=', window),
          sql<boolean>`${exp.ref('start_time')} > NOW() - INTERVAL '24 hours'`,
        ]),
      )
      .groupBy(() => ['asset_start', 'asset_end']);

    // Joins summaryTable with candlesTable to get pair info with the latest candles
    const joinedTable = this.db
      .selectFrom(summaryTable.as('summary'))
      .innerJoin(candlesTable.as('candles'), join =>
        join
          .onRef('candles.asset_start', '=', 'summary.asset_start')
          .onRef('candles.asset_end', '=', 'summary.asset_end'),
      )
      .select([
        'summary.asset_start',
        'summary.asset_end',
        'summary.price',
        'summary.price_then',
        'summary.the_window',
        'summary.direct_volume_over_window',
        'summary.swap_volume_over_window',
        'summary.liquidity',
        'summary.liquidity_then',
        'summary.trades_over_window',
        'summary.low',
        'summary.high',
        'candles.candles',
      ])
      .limit(limit)
      .offset(offset);

    return joinedTable.execute();
  }
}

export const pindexer = new Pindexer();
