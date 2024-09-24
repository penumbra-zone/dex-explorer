import { DexQueryServiceClient } from '@/utils/protos/services/dex/dex-query-service-client';
import { NextApiRequest, NextApiResponse } from 'next';
import { DirectedTradingPair } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { base64ToUint8Array } from '@/utils/math/base64';
import { fetchAllTokenAssets } from '@/utils/token/tokenFetch';

const grpcEndpoint = process.env['PENUMBRA_GRPC_ENDPOINT'] ?? '';
if (!grpcEndpoint) {
  throw new Error('PENUMBRA_GRPC_ENDPOINT is not set');
}

const { fromEntries } = Object;

export default async function candleStickData(req: NextApiRequest, res: NextApiResponse) {
  const { tokenIn, tokenOut, startHeight, limit } = req.query as {
    tokenIn?: string;
    tokenOut?: string;
    startHeight?: string;
    limit?: string;
  };

  if (!startHeight || !tokenIn || !tokenOut || !limit) {
    res.status(400).json({ error: 'Invalid query parameters' });
    return;
  }

  // Set a HARD limit to prevent abuse
  if (Number(limit) > 10000) {
    res.status(400).json({ error: 'Limit exceeded' });
    return;
  }

  const tokenAssets = fetchAllTokenAssets();
  const tokenAssetsByDisplay = fromEntries(
    tokenAssets.map(asset => [asset.display.toLowerCase(), asset]),
  );

  const tokenInInner = tokenAssetsByDisplay[tokenIn.toLowerCase()]?.inner;
  const tokenOutInner = tokenAssetsByDisplay[tokenOut.toLowerCase()]?.inner;

  if (!tokenInInner || !tokenOutInner) {
    res.status(400).json({
      error: `Invalid token pair, a token was not found: ${tokenIn} ${tokenOut}`,
    });
    return;
  }

  const tradingPair = new DirectedTradingPair();
  tradingPair.start = new AssetId();
  tradingPair.start.inner = base64ToUint8Array(tokenInInner);
  tradingPair.end = new AssetId();
  tradingPair.end.inner = base64ToUint8Array(tokenOutInner);

  const dexQuerier = new DexQueryServiceClient({ grpcEndpoint });
  const data = await dexQuerier.candlestickData(tradingPair, Number(startHeight), Number(limit));

  res.status(200).json(data ?? []);
}
