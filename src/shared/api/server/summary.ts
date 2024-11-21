import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { DexExPairsSummary } from '@/shared/database/schema.ts';
import { durationWindows, isDurationWindow } from '@/shared/utils/duration.ts';

export type SummaryResponse = DexExPairsSummary | { error: string; status: number };

export const getSummary = async (req: { url: string }): Promise<SummaryResponse> => {
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!chainId) {
    return { error: 'PENUMBRA_CHAIN_ID is not set', status: 500 };
  }

  try {
    const { searchParams } = new URL(req.url);
    const baseAssetSymbol = searchParams.get('baseAsset');
    const quoteAssetSymbol = searchParams.get('quoteAsset');
    if (!baseAssetSymbol || !quoteAssetSymbol) {
      return { error: 'Missing required baseAsset or quoteAsset', status: 400 };
    }

    const durationWindow = searchParams.get('durationWindow');
    if (!durationWindow || !isDurationWindow(durationWindow)) {
      return {
        error: `durationWindow missing or invalid window. Options: ${durationWindows.join(', ')}`,
        status: 400,
      };
    }

    const registryClient = new ChainRegistryClient();
    const registry = await registryClient.remote.get(chainId);

    // TODO: Add getMetadataBySymbol() helper to registry npm package
    const allAssets = registry.getAllAssets();
    const baseAssetMetadata = allAssets.find(
      a => a.symbol.toLowerCase() === baseAssetSymbol.toLowerCase(),
    );
    const quoteAssetMetadata = allAssets.find(
      a => a.symbol.toLowerCase() === quoteAssetSymbol.toLowerCase(),
    );
    if (!baseAssetMetadata?.penumbraAssetId || !quoteAssetMetadata?.penumbraAssetId) {
      return { error: `Base asset or quoteAsset assetId not found in registry`, status: 400 };
    }

    const results = await pindexer.summary(
      durationWindow,
      baseAssetMetadata.penumbraAssetId,
      quoteAssetMetadata.penumbraAssetId,
    );

    const summary = results[0];
    if (!summary) {
      return { error: `No summary found for ${baseAssetSymbol}/${quoteAssetSymbol}`, status: 400 };
    }

    return summary;
  } catch (error) {
    return { error: String(error), status: 500 };
  }
};

export const GET = async (req: NextRequest): Promise<NextResponse<SummaryResponse>> => {
  const res = await getSummary(req);
  return NextResponse.json(res, { status: 'error' in res ? res.status : 200 });
};
