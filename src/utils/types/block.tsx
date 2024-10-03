// @ts-nocheck
/* eslint-disable -- disabling this file as this was created before our strict rules */
import { SwapExecution } from "@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb";

export interface BlockInfo {
  height: number;
  created_at: string;
}

export type BlockInfoMap = Record<number, BlockInfo>;

