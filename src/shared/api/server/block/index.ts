import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import {
  BlockSummaryApiResponse,
  BatchSwapSummaryDisplay,
} from '@/shared/api/server/block/types.ts';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { ChainRegistryClient, Registry } from '@penumbra-labs/registry';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { pnum } from '@penumbra-zone/types/pnum';
import { BatchSwapSummary } from '@/shared/database/schema';

export const getBatchSwapDisplayData =
  (registry: Registry) =>
  (batchSwapSummary: BatchSwapSummary): BatchSwapSummaryDisplay => {
    const startAssetId = new AssetId({
      inner: Uint8Array.from(batchSwapSummary.asset_start),
    });
    const startMetadata = registry.getMetadata(startAssetId);
    const startExponent = getDisplayDenomExponent.optional(startMetadata) ?? 0;

    const endAssetId = new AssetId({ inner: Uint8Array.from(batchSwapSummary.asset_end) });
    const endMetadata = registry.getMetadata(endAssetId);
    const endExponent = getDisplayDenomExponent.optional(endMetadata) ?? 0;

    return {
      startAsset: startMetadata,
      endAsset: endMetadata,
      startPrice: Number(batchSwapSummary.output) / Number(batchSwapSummary.input),
      endPrice: Number(batchSwapSummary.input) / Number(batchSwapSummary.output),
      startAmount: pnum(
        // convert string to bigint so that pnum parses it in base units
        // which means we can use the exponent to format it in display units
        batchSwapSummary.input,
        startExponent,
      ).toFormattedString(),
      startValueView: pnum(
        // convert string to bigint so that pnum parses it in base units
        // which means we can use the exponent to format it in display units
        batchSwapSummary.input,
        startExponent,
      ).toValueView(),
      endAmount: pnum(
        // convert string to bigint so that pnum parses it in base units
        // which means we can use the exponent to format it in display units
        batchSwapSummary.output,
        endExponent,
      ).toFormattedString(),
      endValueView: pnum(
        // convert string to bigint so that pnum parses it in base units
        // which means we can use the exponent to format it in display units
        batchSwapSummary.output,
        endExponent,
      ).toValueView(),
      numSwaps: batchSwapSummary.num_swaps,
    };
  };

export async function GET(req: NextRequest): Promise<NextResponse<BlockSummaryApiResponse>> {
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!chainId) {
    return NextResponse.json({ error: 'PENUMBRA_CHAIN_ID is not set' }, { status: 500 });
  }

  const height = req.nextUrl.searchParams.get('height');
  if (!height) {
    return NextResponse.json({ error: 'height is required' }, { status: 400 });
  }

  const registryClient = new ChainRegistryClient();
  const registry = await registryClient.remote.get(chainId);

  const blockSummary = await pindexer.getBlockSummary(Number(height));

  if (!blockSummary) {
    return NextResponse.json({ error: 'Block summary not found' }, { status: 404 });
  }

  return NextResponse.json({
    height: blockSummary.height,
    time: blockSummary.time,
    batchSwaps: blockSummary.batch_swaps.map(getBatchSwapDisplayData(registry)),
    numOpenLps: blockSummary.num_open_lps,
    numClosedLps: blockSummary.num_closed_lps,
    numWithdrawnLps: blockSummary.num_withdrawn_lps,
    numSwaps: blockSummary.num_swaps,
    numSwapClaims: blockSummary.num_swap_claims,
    numTxs: blockSummary.num_txs,
  });
}
