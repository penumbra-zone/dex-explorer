import { NextRequest, NextResponse } from 'next/server';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { pindexer } from '@/shared/database';
import { isValidDate } from 'iso-datestring-validator';
import { Candle } from '@/shared/api/server/candles/types.ts';

const MAX_LIMIT = 10000n;
export type CandleApiResponse = Candle[] | { error: string };

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
  const limitParam = searchParams.get('limit');
  if (!baseAssetSymbol || !quoteAssetSymbol || !limitParam) {
    return NextResponse.json(
      { error: 'Missing required baseAsset, quoteAsset, or limit' },
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

  const limit = BigInt(limitParam);
  // Set a HARD limit to prevent abuse
  if (limit > MAX_LIMIT) {
    return NextResponse.json({ error: `Limit exceeded, max ${MAX_LIMIT}` }, { status: 400 });
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
  );

  return NextResponse.json(candlesFwd);
}
