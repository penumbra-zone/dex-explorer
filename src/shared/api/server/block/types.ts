import { JsonValue } from '@bufbuild/protobuf';

export interface BatchSwapSummaryDisplay {
  startAsset: JsonValue;
  endAsset: JsonValue;
  startInput: string;
  endOutput: string;
  endPrice: string;
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
