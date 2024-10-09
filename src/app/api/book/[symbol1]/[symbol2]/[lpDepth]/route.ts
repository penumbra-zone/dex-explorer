import { NextResponse } from "next/server";
import { DexQueryServiceClient } from "@/old/utils/protos/services/dex/dex-query-service-client";
import { AssetId, Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { ChainRegistryClient, Registry } from '@penumbra-labs/registry';

interface Params {
  symbol1: string;
  symbol2: string;
  lpDepth: string;
}

function getMetadataBySymbol(metadata: Metadata[], symbol: string): Metadata | undefined {
  const regex = new RegExp(`^${symbol}$`, 'i');
  return metadata.find(asset => regex.test(asset.symbol));
}
 
export async function GET(request: Request, context: { params: Params }) {
  const { symbol1, symbol2, lpDepth: lpDepthQuery } = context.params;
  const lpDepth = Number(lpDepthQuery);

  const chainRegistryClient = new ChainRegistryClient();
  const registry = await chainRegistryClient.remote.get(process.env['PENUMBRA_CHAIN_ID'] ?? '');
  const metadata: Metadata[] = registry.getAllAssets();

  const metadata1 = getMetadataBySymbol(metadata, symbol1);
  const metadata2 = getMetadataBySymbol(metadata, symbol2);

  const querier = new DexQueryServiceClient({
    grpcEndpoint: process.env['PENUMBRA_GRPC_ENDPOINT'] ?? '',
  });

  // const users = await getUsersFromDatabase();  // Replace with actual logic
  return NextResponse.json({
    data: true,
  });
}