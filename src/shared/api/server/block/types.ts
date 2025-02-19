import { Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

export interface BatchSwapSummaryDisplay {
  startAsset: Metadata;
  endAsset: Metadata;
  startExponent: number;
  endExponent: number;
  startInput: string;
  endOutput: string;
  startPrice: string;
  endPrice: string;
  startAmount: string;
  endAmount: string;
  startValueView: ValueView;
  endValueView: ValueView;
  numSwaps: number;
}

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
      height: number;
      time: Date;
      batchSwaps: BatchSwapSummaryDisplay[];
      numOpenLps: number;
      numClosedLps: number;
      numWithdrawnLps: number;
      numSwaps: number;
      numSwapClaims: number;
      numTxs: number;
    }
  | { error: string };

export type BlockSummaryPindexerResponse =
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
  | undefined;
