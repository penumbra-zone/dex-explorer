import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { serialize, Serialized } from '@/shared/utils/serializer';
import { AssetId, Value } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { pnum } from '@penumbra-zone/types/pnum';

const transformDbVal = ({
  asset_end,
  asset_start,
  input,
  output,
  price_float,
  time,
  kind,
  amount_hops,
}: {
  asset_start: Buffer;
  asset_end: Buffer;
  height: number;
  input: string;
  output: string;
  price_float: number;
  time: Date;
  kind: 'buy' | 'sell';
  amount_hops: string[];
}): RecentExecution => {
  const baseAssetId = new AssetId({
    inner: Uint8Array.from(asset_start),
  });
  const quoteAssetId = new AssetId({ inner: Uint8Array.from(asset_end) });

  const timestamp = time.toISOString();

  // When we go from quote to base, we need to invert the price.
  // This makes sense: a UX-friendly price is always denominated in quote assets.
  const price = kind === 'sell' ? price_float : 1 / price_float;
  // We always want to render the base amount in the trade, regardless of the direction.
  // The `kind` field informs on the direction.
  const baseAmount = kind === 'sell' ? input : output;

  return {
    kind,
    amount: new Value({ amount: pnum(baseAmount).toAmount(), assetId: baseAssetId }),
    price: { amount: price, assetId: quoteAssetId },
    timestamp,
    hops: amount_hops.length,
  };
};

export type RecentExecutionsResponse = RecentExecution[] | { error: string };

interface FloatValue {
  assetId: AssetId;
  amount: number;
}

export interface RecentExecution {
  kind: 'buy' | 'sell';
  amount: Value;
  price: FloatValue;
  timestamp: string;
  hops: number;
}

export async function GET(
  req: NextRequest,
): Promise<NextResponse<Serialized<RecentExecutionsResponse>>> {
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!chainId) {
    return NextResponse.json({ error: 'PENUMBRA_CHAIN_ID is not set' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const baseAssetSymbol = searchParams.get('baseAsset');
  const quoteAssetSymbol = searchParams.get('quoteAsset');
  const limit = searchParams.get('limit');
  if (!baseAssetSymbol || !quoteAssetSymbol || !limit) {
    return NextResponse.json(
      { error: 'Missing required baseAsset, quoteAsset, or limit' },
      { status: 400 },
    );
  }

  const registryClient = new ChainRegistryClient();
  const registry = await registryClient.remote.get(chainId);

  const allAssets = registry.getAllAssets();
  const baseAssetMetadata = allAssets.find(
    a => a.symbol.toLowerCase() === baseAssetSymbol.toLowerCase(),
  );
  const quoteAssetMetadata = allAssets.find(
    a => a.symbol.toLowerCase() === quoteAssetSymbol.toLowerCase(),
  );
  if (!baseAssetMetadata?.penumbraAssetId || !quoteAssetMetadata?.penumbraAssetId) {
    return NextResponse.json(
      { error: `Base asset or quoteAsset assetId not found in registry` },
      { status: 400 },
    );
  }

  // We need two queries: * base -> quote (sell)
  //                      * quote -> base (buy)
  const sellStream = await pindexer.recentExecutions(
    baseAssetMetadata.penumbraAssetId,
    quoteAssetMetadata.penumbraAssetId,
    Number(limit),
  );

  const buyStream = await pindexer.recentExecutions(
    quoteAssetMetadata.penumbraAssetId,
    baseAssetMetadata.penumbraAssetId,
    Number(limit),
  );

  const sellResponse = sellStream.map(data => transformDbVal({ ...data, kind: 'sell' }));
  const buyResponse = buyStream.map(data => transformDbVal({ ...data, kind: 'buy' }));
  // Weave the two responses together based on timestamps
  const allResponse = [...sellResponse, ...buyResponse].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return NextResponse.json(serialize(allResponse));
}
