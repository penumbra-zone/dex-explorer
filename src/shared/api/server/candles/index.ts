import { NextRequest, NextResponse } from 'next/server';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { pindexer } from '@/shared/database';
import { isValidDate } from 'iso-datestring-validator';
import { CandleApiResponse, dbCandleToOhlc } from '@/shared/api/server/candles/types.ts';
import { durationWindows, isDurationWindow } from '@/shared/database/schema.ts';

const MAX_LIMIT = 10000n;

export async function GET(req: NextRequest): Promise<NextResponse<CandleApiResponse>> {
  const grpcEndpoint = process.env['PENUMBRA_GRPC_ENDPOINT'];
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!grpcEndpoint || !chainId) {
    return NextResponse.json(
      { error: 'PENUMBRA_GRPC_ENDPOINT or PENUMBRA_CHAIN_ID is not set' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const baseAssetSymbol = searchParams.get('baseAsset');
  const quoteAssetSymbol = searchParams.get('quoteAsset');
  if (!baseAssetSymbol || !quoteAssetSymbol) {
    return NextResponse.json(
      { error: 'Missing required baseAsset or quoteAsset' },
      { status: 400 },
    );
  }
  const durationWindow = searchParams.get('durationWindow');
  if (!durationWindow || !isDurationWindow(durationWindow)) {
    return NextResponse.json(
      { error: `durationWindow missing or invalid window. Options: ${durationWindows.join(', ')}` },
      { status: 400 },
    );
  }

  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  if (
    !startDateParam ||
    !endDateParam ||
    !isValidDate(startDateParam) ||
    !isValidDate(endDateParam)
  ) {
    return NextResponse.json(
      { error: 'start or end date missing or invalid iso format' },
      { status: 400 },
    );
  }
  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);

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
    return NextResponse.json(
      { error: `Base asset or quoteAsset asset ids not found in registry` },
      { status: 400 },
    );
  }

  // TODO: DOCUMENT
  const candlesFwd = await pindexer.candles(
    baseAssetMetadata.penumbraAssetId,
    quoteAssetMetadata.penumbraAssetId,
    startDate,
    endDate,
    durationWindow,
  );

  const response = candlesFwd.map(dbCandleToOhlc);

  return NextResponse.json(response);
}
