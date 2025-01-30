import { ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

export interface BlockSummaryData {
    height: number;
    timestamp: string;
    totalTransactions: number;
    totalVolume: ValueView;
    totalFees: ValueView;
    totalBatchSwaps: number;
} 