import { DexQueryServiceClient } from '@/utils/protos/services/dex/dex-query-service-client';
import { IndexerQuerier } from '@/utils/indexer/connector';
import { NextApiRequest, NextApiResponse } from 'next';
import { DirectedTradingPair } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { base64ToUint8Array } from '@/utils/math/base64';
import { fetchAllTokenAssets } from '@/utils/token/tokenFetch';
import { createMergeCandles } from '@/utils/candles';
import { Token } from '@/utils/types/token';

const grpcEndpoint = process.env['PENUMBRA_GRPC_ENDPOINT'] ?? '';
if (!grpcEndpoint) {
  throw new Error('PENUMBRA_GRPC_ENDPOINT is not set');
}

const indexerEndpoint = process.env['PENUMBRA_INDEXER_ENDPOINT'] ?? '';
if (!indexerEndpoint) {
  throw new Error('PENUMBRA_INDEXER_ENDPOINT is not set');
}

interface QueryParams {
  symbol1?: string;
  symbol2?: string;
  startHeight?: string;
  limit?: string;
}

function getTokenAssetBySymbol(tokenAssets: Token[], symbol: string): Token | undefined {
  const regex = new RegExp(`^${symbol}$`, 'i');
  return tokenAssets.find(asset => regex.test(asset.symbol));
}

function getDirectedTradingPair(assetIn: Token, assetOut: Token) {
  const tradingPair = new DirectedTradingPair();
  tradingPair.start = new AssetId();
  tradingPair.start.inner = base64ToUint8Array(assetIn.inner);
  tradingPair.end = new AssetId();
  tradingPair.end.inner = base64ToUint8Array(assetOut.inner);
  return tradingPair;
}

export default async function candleStickData(req: NextApiRequest, res: NextApiResponse) {
  const { symbol1, symbol2, startHeight, limit } = req.query as QueryParams;
  console.log('TCL: candleStickData -> startHeight', startHeight);

  if ((!startHeight && startHeight !== '0') || !symbol1 || !symbol2 || !limit) {
    res.status(400).json({ error: 'Invalid query parameters' });
    return;
  }

  // Set a HARD limit to prevent abuse
  if (Number(limit) > 10000) {
    res.status(400).json({ error: 'Limit exceeded' });
    return;
  }

  const tokenAssets = fetchAllTokenAssets();
  const asset1 = getTokenAssetBySymbol(tokenAssets, symbol1);
  const asset2 = getTokenAssetBySymbol(tokenAssets, symbol2);

  if (!asset1 || !asset2) {
    res.status(400).json({
      error: `Invalid token pair ${symbol1}:${symbol2}`,
    });
    return;
  }

  const dexQuerier = new DexQueryServiceClient({ grpcEndpoint });
  const indexerQuerier = new IndexerQuerier(indexerEndpoint);
  const tradingPair = getDirectedTradingPair(asset1, asset2);
  const reversePair = getDirectedTradingPair(asset2, asset1);

  const [candlesFwd, candlesRev] = await Promise.all([
    dexQuerier.candlestickData(tradingPair, Number(startHeight), Number(limit)),
    dexQuerier.candlestickData(reversePair, Number(startHeight), Number(limit)),
  ]);

  const mergeCandles = createMergeCandles(asset1, asset2);
  const mergedCandles = mergeCandles(candlesFwd, candlesRev);
  console.log('TCL: candleStickData -> mergedCandles', mergedCandles);

  if (Number(startHeight) === 0) {
    const endHeight = await indexerQuerier
      .fetchMostRecentNBlocks(1)
      .then(resp => resp?.[0]?.height);
    const startHeight = endHeight - limit;
    const blocks = Array.from({ length: endHeight - startHeight + 1 }, (_, i) => startHeight + i);
    const data = await indexerQuerier.fetchBlocksByHeight(blocks);
    console.log('TCL: candleStickData -> data', data);
  }
  // const resp = await indexerQuerier.fetchMostRecentNBlocks(1);
  // const startingBlock = Number(startHeight) === 0 ?
  // console.log('TCL: candleStickData -> resp', resp);

  // const blocks = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  res.status(200).json(mergedCandles ?? []);
}
