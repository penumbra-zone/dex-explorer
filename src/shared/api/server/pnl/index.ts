import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { hexToUint8Array } from '@penumbra-zone/types/hex';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const grpcEndpoint = process.env['PENUMBRA_GRPC_ENDPOINT'];
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!grpcEndpoint || !chainId) {
    return NextResponse.json(
      { error: 'PENUMBRA_GRPC_ENDPOINT or PENUMBRA_CHAIN_ID is not set' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const basePenumbraAssetId = searchParams.get('baseAssetId');
  const quotePenumbraAssetId = searchParams.get('quoteAssetId');
  if (!basePenumbraAssetId || !quotePenumbraAssetId) {
    return NextResponse.json(
      { error: 'Missing required baseAsset or quoteAsset' },
      { status: 400 },
    );
  }

  const startTime = searchParams.get('startTime') ?? 0;
  console.log('TCL: startTime', startTime);
  const endTime = searchParams.get('endTime') ?? Date.now();
  console.log('TCL: endTime', endTime);
  if (!startTime) {
    return NextResponse.json({ error: 'Missing required startTime' }, { status: 400 });
  }

  const baseAssetId = new AssetId({ inner: hexToUint8Array(basePenumbraAssetId) });
  const quoteAssetId = new AssetId({ inner: hexToUint8Array(quotePenumbraAssetId) });

  const startPrice = await pindexer.getPrice({
    baseAssetId,
    quoteAssetId,
    time: Number(startTime),
  });
  console.log('TCL: startPrice', startPrice);

  const endPrice = await pindexer.getPrice({
    baseAssetId,
    quoteAssetId,
    time: Number(endTime),
  });
  console.log('TCL: endPrice', endPrice);

  if (!startPrice || !endPrice || typeof startPrice !== 'number' || typeof endPrice !== 'number') {
    return NextResponse.json({ error: 'Price not found' }, { status: 400 });
  }

  return NextResponse.json({
    startPrice: startPrice,
    endPrice: endPrice,
    pnl: endPrice - startPrice,
    pnlPercentage: ((endPrice - startPrice) / startPrice) * 100,
  });
}
