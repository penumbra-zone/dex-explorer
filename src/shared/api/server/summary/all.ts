import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { DurationWindow, durationWindows, isDurationWindow } from '@/shared/utils/duration.ts';
import { adaptSummary, SummaryData } from '@/shared/api/server/summary/types.ts';
import { AssetId, Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { serialize, Serialized } from '@/shared/utils/serializer';

interface GetPairsParams {
  window: DurationWindow;
  limit: number;
  offset: number;
  search: string;
}

const getAssetById = (allAssets: Metadata[], id: Buffer): Metadata | undefined => {
  return allAssets.find(asset => {
    return asset.penumbraAssetId?.equals(new AssetId({ inner: id }));
  });
};

export const getAllSummaries = async (
  params: GetPairsParams,
): Promise<Serialized<SummaryData>[]> => {
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!chainId) {
    throw new Error('PENUMBRA_CHAIN_ID is not set');
  }

  const registryClient = new ChainRegistryClient();
  const registry = await registryClient.remote.get(chainId);

  const stablecoins = registry
    .getAllAssets()
    .filter(asset => ['USDT', 'USDC', 'USDY'].includes(asset.symbol))
    .map(asset => asset.penumbraAssetId) as AssetId[];

  const results = await pindexer.summaries({
    ...params,
    stablecoins,
  });

  const allAssets = registry.getAllAssets();

  const summaries = await Promise.all(
    results.map(summary => {
      const baseAsset = getAssetById(allAssets, summary.asset_start);
      const quoteAsset = getAssetById(allAssets, summary.asset_end);
      if (!baseAsset || !quoteAsset) {
        return undefined;
      }

      const data = adaptSummary(
        summary,
        baseAsset,
        quoteAsset,
        summary.candles,
        summary.candle_times,
      );

      return serialize(data);
    }),
  );

  return summaries.filter(Boolean) as Serialized<SummaryData>[];
};

export type SummariesResponse = Serialized<SummaryData>[] | { error: string };

export const GET = async (req: NextRequest): Promise<NextResponse<SummariesResponse>> => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 15;
    const offset = Number(searchParams.get('offset')) || 0;
    const search = searchParams.get('search') ?? '';
    const window = searchParams.get('durationWindow');

    if (!window || !isDurationWindow(window)) {
      return NextResponse.json(
        {
          error: `durationWindow missing or invalid window. Options: ${durationWindows.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const result = await getAllSummaries({
      window,
      limit,
      offset,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: `Error: ${(error as Error).message}` }, { status: 500 });
  }
};
