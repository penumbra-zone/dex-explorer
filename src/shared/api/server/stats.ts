import { NextRequest, NextResponse } from 'next/server';
import { JsonValue } from '@bufbuild/protobuf';
import { ValueView, AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { ChainRegistryClient, Registry } from '@penumbra-labs/registry';
import { DexExAggregateSummary } from '@/shared/database/schema';
import { pindexer } from '@/shared/database';
import { durationWindows, isDurationWindow } from '@/shared/utils/duration';
import { toValueView } from '@/shared/utils/value-view';

interface StatsDataBase {
  activePairs: number;
  trades: number;
  largestPair?: { start: string; end: string };
  topPriceMover?: { start: string; end: string; percent: number };
}

export interface StatsData extends StatsDataBase {
  directVolume: ValueView;
  liquidity: ValueView;
  largestPairLiquidity?: ValueView;
}

export interface StatsJSONData extends StatsDataBase {
  liquidity: JsonValue;
  directVolume: JsonValue;
  largestPairLiquidity?: JsonValue;
}

export type StatsResponse = StatsJSONData | { error: string };

const serializeStats = (stats: DexExAggregateSummary, registry: Registry): StatsJSONData => {
  // TODO: Add getMetadataBySymbol() helper to registry npm package
  const allAssets = registry.getAllAssets();
  // TODO: what asset should be used here?
  const usdcMetadata = allAssets.find(asset => asset.symbol.toLowerCase() === 'usdc');
  if (!usdcMetadata) {
    throw new Error('USDC not found in registry');
  }

  const topPriceMoverStart = allAssets.find(asset => {
    return asset.penumbraAssetId?.equals(new AssetId({ inner: stats.top_price_mover_start }));
  });
  const topPriceMoverEnd = allAssets.find(asset => {
    return asset.penumbraAssetId?.equals(new AssetId({ inner: stats.top_price_mover_end }));
  });
  const topPriceMover = topPriceMoverStart &&
    topPriceMoverEnd && {
      start: topPriceMoverStart.symbol,
      end: topPriceMoverEnd.symbol,
      percent: stats.top_price_mover_change_percent,
    };

  const largestPairStart = allAssets.find(asset => {
    return asset.penumbraAssetId?.equals(
      new AssetId({ inner: stats.largest_dv_trading_pair_start }),
    );
  });
  const largestPairEnd = allAssets.find(asset => {
    return asset.penumbraAssetId?.equals(new AssetId({ inner: stats.largest_dv_trading_pair_end }));
  });
  const largestPair = largestPairStart &&
    largestPairEnd && {
      start: largestPairStart.symbol,
      end: largestPairEnd.symbol,
    };

  return {
    activePairs: stats.active_pairs,
    trades: stats.trades,
    largestPair,
    topPriceMover,
    largestPairLiquidity:
      largestPairEnd &&
      toValueView({
        amount: stats.largest_dv_trading_pair_volume,
        metadata: largestPairEnd,
      }).toJson(),
    liquidity: toValueView({
      amount: parseInt(`${stats.liquidity}`),
      metadata: usdcMetadata,
    }).toJson(),
    directVolume: toValueView({ amount: stats.direct_volume, metadata: usdcMetadata }).toJson(),
  };
};

export async function GET(req: NextRequest): Promise<NextResponse<StatsResponse>> {
  try {
    const { searchParams } = new URL(req.url);

    const durationWindow = searchParams.get('durationWindow');
    if (!durationWindow || !isDurationWindow(durationWindow)) {
      return NextResponse.json(
        {
          error: `durationWindow missing or invalid window. Options: ${durationWindows.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const chainId = process.env['PENUMBRA_CHAIN_ID'];
    if (!chainId) {
      return NextResponse.json({ error: 'PENUMBRA_CHAIN_ID is not set' }, { status: 500 });
    }

    const registryClient = new ChainRegistryClient();

    const [registry, results] = await Promise.all([
      registryClient.remote.get(chainId),
      pindexer.stats(durationWindow),
    ]);

    const stats = results[0];
    if (!stats) {
      return NextResponse.json({ error: `No stats found` }, { status: 400 });
    }

    return NextResponse.json(serializeStats(stats, registry));
  } catch (error) {
    console.error('AAA', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
