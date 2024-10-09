import { NextResponse } from 'next/server';
import { DexQueryServiceClient } from '@/old/utils/protos/services/dex/dex-query-service-client';
import { DirectedTradingPair } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { ChainRegistryClient } from '@penumbra-labs/registry';

const chainRegistryClient = new ChainRegistryClient();
const querier = new DexQueryServiceClient({
  grpcEndpoint: process.env['PENUMBRA_GRPC_ENDPOINT'] ?? '',
});

interface Params {
  symbol1: string;
  symbol2: string;
  limit: string;
}

function getMetadataBySymbol(metadata: Metadata[], symbol: string): Metadata | undefined {
  const regex = new RegExp(`^${symbol}$`, 'i');
  return metadata.find(asset => regex.test(asset.symbol));
}

export async function GET(_request: Request, context: { params: Params }) {
  const { symbol1, symbol2, limit: limitParam } = context.params;
  const limit = Number(limitParam);

  const registry = await chainRegistryClient.remote.get(process.env['PENUMBRA_CHAIN_ID'] ?? '');
  const metadata: Metadata[] = registry.getAllAssets();

  const metadata1 = getMetadataBySymbol(metadata, symbol1);
  const metadata2 = getMetadataBySymbol(metadata, symbol2);

  const tradingPair = new DirectedTradingPair({
    start: metadata1?.penumbraAssetId,
    end: metadata2?.penumbraAssetId,
  });
  const reversePair = new DirectedTradingPair({
    start: metadata2?.penumbraAssetId,
    end: metadata1?.penumbraAssetId,
  });

  const data = await Promise.all([
    querier.liquidityPositionsByPrice(tradingPair, limit),
    querier.liquidityPositionsByPrice(reversePair, limit),
  ]).then(resps => resps.flat());

  return NextResponse.json(data);
}
