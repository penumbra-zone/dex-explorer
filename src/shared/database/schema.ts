// kysely-codegen helped generate the types for this file

import type { ColumnType } from 'kysely';

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export type JsonArray = JsonValue[];

/* eslint-disable-next-line -- record cannot be used as it creates circular references */
export interface JsonObject {
  [x: string]: JsonValue | undefined;
}

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const durationWindows = ['1m', '15m', '1h', '4h', '1d', '1w', '1mo'] as const;
export type DurationWindow = (typeof durationWindows)[number];
export const isDurationWindow = (str: string): str is DurationWindow =>
  durationWindows.includes(str as DurationWindow);

export interface DexExAggregateSummary {
  active_pairs: number;
  direct_volume: number;
  largest_dv_trading_pair_end: Buffer;
  largest_dv_trading_pair_start: Buffer;
  largest_dv_trading_pair_volume: number;
  largest_sv_trading_pair_end: Buffer;
  largest_sv_trading_pair_start: Buffer;
  largest_sv_trading_pair_volume: number;
  liquidity: number;
  swap_volume: number;
  the_window: DurationWindow;
  top_price_mover_change_percent: number;
  top_price_mover_end: Buffer;
  top_price_mover_start: Buffer;
  trades: number;
}

export interface DexExPairsBlockSnapshot {
  asset_end: Buffer;
  asset_start: Buffer;
  direct_volume: number;
  id: Generated<number>;
  liquidity: number;
  price: number;
  swap_volume: number;
  time: Timestamp;
  trades: number;
}

export interface DexExPairsSummary {
  asset_end: Buffer;
  asset_start: Buffer;
  direct_volume_over_window: number;
  liquidity: number;
  liquidity_then: number;
  price: number;
  price_then: number;
  swap_volume_over_window: number;
  the_window: DurationWindow;
  trades_over_window: number;
}

export interface DexExPriceCharts {
  asset_end: Buffer;
  asset_start: Buffer;
  close: number;
  direct_volume: number;
  high: number;
  id: Generated<number>;
  low: number;
  open: number;
  start_time: Timestamp;
  swap_volume: number;
  the_window: DurationWindow;
}

export interface DB {
  dex_ex_aggregate_summary: DexExAggregateSummary;
  dex_ex_pairs_block_snapshot: DexExPairsBlockSnapshot;
  dex_ex_pairs_summary: DexExPairsSummary;
  dex_ex_price_charts: DexExPriceCharts;
}
