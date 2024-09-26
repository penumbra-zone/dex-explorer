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

interface QueryParams {
  symbol1?: string;
  symbol2?: string;
  startHeight?: string;
  limit?: string;
}

export default async function candleStickData(req: NextApiRequest, res: NextApiResponse) {
  const { symbol1, symbol2, startHeight, limit } = req.query as QueryParams;

  if (!startHeight || !symbol1 || !symbol2 || !limit) {
    res.status(400).json({ error: 'Invalid query parameters' });
    return;
  }

  // Set a HARD limit to prevent abuse
  if (Number(limit) > 10000) {
    res.status(400).json({ error: 'Limit exceeded' });
    return;
  }

  const tokenAssets = fetchAllTokenAssets();
  const tokenAssetsBySymbol = fromEntries(
    tokenAssets.map(asset => [asset.symbol.toLowerCase(), asset]),
  );

  const asset1Inner = tokenAssetsBySymbol[symbol1.toLowerCase()]?.inner;
  const asset2Inner = tokenAssetsBySymbol[symbol2.toLowerCase()]?.inner;

  if (!asset1Inner || !asset2Inner) {
    res.status(400).json({
      error: `Invalid token pair ${symbol1}:${symbol2}`,
    });
    return;
  }

  const tradingPair = new DirectedTradingPair();
  tradingPair.start = new AssetId();
  tradingPair.start.inner = base64ToUint8Array(asset1Inner);
  tradingPair.end = new AssetId();
  tradingPair.end.inner = base64ToUint8Array(asset2Inner);

  const dexQuerier = new DexQueryServiceClient({ grpcEndpoint });
  const data = await dexQuerier.candlestickData(tradingPair, Number(startHeight), Number(limit));

  res.status(200).json(data ?? []);
}
