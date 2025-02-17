export interface BatchSwapSummary {
  asset_start: Buffer;
  asset_end: Buffer;
  input: string;
  output: string;
  num_swaps: number;
  price_float: number;
}

export type BlockSummaryApiResponse =
  | {
      rowid: number;
      height: number;
      time: Date;
      batch_swaps: BatchSwapSummary[];
      num_open_lps: number;
      num_closed_lps: number;
      num_withdrawn_lps: number;
      num_swaps: number;
      num_swap_claims: number;
      num_txs: number;
    }
  | { error: string };
