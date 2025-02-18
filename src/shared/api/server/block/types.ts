import { Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

export interface BatchSwapSummaryDisplay {
  startAsset: Metadata;
  endAsset: Metadata;
  startPrice: number;
  endPrice: number;
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
      rowid: number;
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
