// @ts-nocheck
/* eslint-disable -- auto generated file */
import { DurationWindow } from '@/shared/utils/duration.ts';
/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from 'kysely';

export type ArrayType<T> = ArrayTypeImpl<T> extends (infer U)[] ? U[] : ArrayTypeImpl<T>;

export type ArrayTypeImpl<T> =
  T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S[], I[], U[]> : T[];

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Numeric = ColumnType<string, number | string, number | string>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface _InsightsShieldedPoolDepositors {
  address: string;
  asset_id: Buffer;
}

export interface _InsightsValidators {
  height: Int8;
  rate_bps2: Int8;
  um: Int8;
  validator_id: string;
}

export interface BlockDetails {
  height: Int8;
  root: Buffer;
  timestamp: Timestamp;
}

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

export interface DexExBatchSwapTraces {
  amount_hops: ArrayType<Numeric>;
  asset_end: Buffer;
  asset_hops: ArrayType<Buffer>;
  asset_start: Buffer;
  batch_input: Numeric;
  batch_output: Numeric;
  height: number;
  input: Numeric;
  output: Numeric;
  position_id_hops: ArrayType<Buffer>;
  price_float: number;
  rowid: Generated<number>;
  time: Timestamp;
}

export interface DexExMetadata {
  id: number;
  quote_asset_id: Buffer;
}

export interface DexExPairsBlockSnapshot {
  asset_end: Buffer;
  asset_start: Buffer;
  direct_volume: number;
  id: Generated<number>;
  liquidity: number;
  price: number;
  start_price_indexing_denom: number;
  swap_volume: number;
  time: Timestamp;
  trades: number;
}

export interface DexExPairsSummary {
  asset_end: Buffer;
  asset_start: Buffer;
  direct_volume_indexing_denom_over_window: number;
  direct_volume_over_window: number;
  high: number;
  liquidity: number;
  liquidity_then: number;
  low: number;
  price: number;
  price_then: number;
  swap_volume_indexing_denom_over_window: number;
  swap_volume_over_window: number;
  the_window: DurationWindow;
  trades_over_window: number;
}

export interface DexExPositionExecutions {
  context_asset_end: Buffer;
  context_asset_start: Buffer;
  delta_1: Numeric;
  delta_2: Numeric;
  fee_1: Numeric;
  fee_2: Numeric;
  height: number;
  lambda_1: Numeric;
  lambda_2: Numeric;
  position_id: Buffer;
  reserves_rowid: number;
  rowid: Generated<number>;
  time: Timestamp;
}

export interface DexExPositionReserves {
  height: number;
  position_id: Buffer;
  reserves_1: Numeric;
  reserves_2: Numeric;
  rowid: Generated<number>;
  time: Timestamp;
}

export interface DexExPositionState {
  asset_1: Buffer;
  asset_2: Buffer;
  close_on_fill: boolean;
  closing_height: number | null;
  closing_time: Timestamp | null;
  closing_tx: Buffer | null;
  effective_price_1_to_2: number;
  effective_price_2_to_1: number;
  fee_bps: number;
  opening_height: number;
  opening_reserves_rowid: number;
  opening_time: Timestamp;
  opening_tx: Buffer | null;
  p: Numeric;
  position_id: Buffer;
  position_raw: Buffer;
  q: Numeric;
  rowid: Generated<number>;
}

export interface DexExPositionWithdrawals {
  height: number;
  position_id: Buffer;
  reserves_1: Numeric;
  reserves_2: Numeric;
  reserves_rowid: number;
  rowid: Generated<number>;
  sequence: number;
  time: Timestamp;
  withdrawal_tx: Buffer | null;
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

export interface GovernanceDelegatorVotes {
  block_height: Int8;
  id: Generated<number>;
  identity_key: string;
  proposal_id: number;
  vote: Json;
  voting_power: Int8;
}

export interface GovernanceProposals {
  description: string;
  end_block_height: Int8;
  id: Generated<number>;
  kind: Json;
  payload: Json | null;
  proposal_deposit_amount: Int8;
  proposal_id: number;
  start_block_height: Int8;
  state: Json;
  title: string;
  withdrawal_reason: string | null;
  withdrawn: Generated<boolean | null>;
}

export interface GovernanceValidatorVotes {
  block_height: Int8;
  id: Generated<number>;
  identity_key: string;
  proposal_id: number;
  vote: Json;
  voting_power: Int8;
}

export interface IbcTransfer {
  amount: Numeric;
  asset: Buffer;
  foreign_addr: string;
  height: Int8;
  id: Generated<number>;
  kind: string;
  penumbra_addr: Buffer;
}

export interface IndexWatermarks {
  height: Int8;
  index_name: string;
}

export interface InsightsShieldedPool {
  asset_id: Buffer;
  current_value: string;
  height: Int8;
  total_value: string;
  unique_depositors: number;
}

export interface InsightsShieldedPoolLatest {
  asset_id: Buffer | null;
  current_value: string | null;
  height: Int8 | null;
  total_value: string | null;
  unique_depositors: number | null;
}

export interface InsightsSupply {
  height: Int8;
  market_cap: Generated<number | null>;
  price: number | null;
  price_numeraire_asset_id: Buffer | null;
  staked: Int8;
  total: Int8;
}

export interface StakeDelegationTxs {
  amount: Int8;
  height: Int8;
  id: Generated<number>;
  ik: string;
  tx_hash: Buffer;
}

export interface StakeSlashings {
  epoch_index: Int8;
  height: Int8;
  id: Generated<number>;
  ik: string;
  penalty: string;
}

export interface StakeUndelegationTxs {
  amount: Int8;
  height: Int8;
  id: Generated<number>;
  ik: string;
  tx_hash: Buffer;
}

export interface StakeValidatorSet {
  bonding_state: string;
  definition: string;
  id: Generated<number>;
  ik: string;
  name: string;
  queued_delegations: Int8;
  queued_undelegations: Int8;
  validator_state: string;
  voting_power: Int8;
}

export interface SupplyTotalStaked {
  del_um: Int8;
  height: Int8;
  rate_bps2: Int8;
  um: Int8;
  validator_id: number;
}

export interface SupplyTotalUnstaked {
  arb: Int8;
  auction: Int8;
  dex: Int8;
  fees: Int8;
  height: Int8;
  um: Int8;
}

export interface SupplyValidators {
  id: Generated<number>;
  identity_key: string;
}

interface RawDB {
  _insights_shielded_pool_depositors: _InsightsShieldedPoolDepositors;
  _insights_validators: _InsightsValidators;
  block_details: BlockDetails;
  dex_ex_aggregate_summary: DexExAggregateSummary;
  dex_ex_batch_swap_traces: DexExBatchSwapTraces;
  dex_ex_metadata: DexExMetadata;
  dex_ex_pairs_block_snapshot: DexExPairsBlockSnapshot;
  dex_ex_pairs_summary: DexExPairsSummary;
  dex_ex_position_executions: DexExPositionExecutions;
  dex_ex_position_reserves: DexExPositionReserves;
  dex_ex_position_state: DexExPositionState;
  dex_ex_position_withdrawals: DexExPositionWithdrawals;
  dex_ex_price_charts: DexExPriceCharts;
  governance_delegator_votes: GovernanceDelegatorVotes;
  governance_proposals: GovernanceProposals;
  governance_validator_votes: GovernanceValidatorVotes;
  ibc_transfer: IbcTransfer;
  index_watermarks: IndexWatermarks;
  insights_shielded_pool: InsightsShieldedPool;
  insights_shielded_pool_latest: InsightsShieldedPoolLatest;
  insights_supply: InsightsSupply;
  stake_delegation_txs: StakeDelegationTxs;
  stake_slashings: StakeSlashings;
  stake_undelegation_txs: StakeUndelegationTxs;
  stake_validator_set: StakeValidatorSet;
  supply_total_staked: SupplyTotalStaked;
  supply_total_unstaked: SupplyTotalUnstaked;
  supply_validators: SupplyValidators;
}

export type DB = Pick<
  RawDB,
  | 'dex_ex_aggregate_summary'
  | 'dex_ex_pairs_block_snapshot'
  | 'dex_ex_pairs_summary'
  | 'dex_ex_price_charts'
  | 'dex_ex_position_executions'
  | 'dex_ex_position_state'
  | 'dex_ex_position_reserves'
  | 'dex_ex_position_withdrawals'
  | 'dex_ex_batch_swap_traces'
  | 'dex_ex_metadata'
>;
