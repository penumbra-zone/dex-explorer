import { NextRequest, NextResponse } from 'next/server';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { pindexer } from '@/shared/database';
import { Metadata, AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

export interface PriceResponse {
    symbol: string;
    price: number | null;
}

export type PricesApiResponse = PriceResponse[] | { error: string };

export async function GET(req: NextRequest): Promise<NextResponse<PricesApiResponse>> {
    const chainId = process.env['PENUMBRA_CHAIN_ID'];
    if (!chainId) {
        return NextResponse.json({ error: 'PENUMBRA_CHAIN_ID is not set' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const symbols = searchParams.getAll('symbol');
    if (!symbols.length) {
        return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const registryClient = new ChainRegistryClient();
    const registry = await registryClient.remote.get(chainId);
    const allAssets = registry.getAllAssets();

    // Find the base asset for price denomination
    const baseAsset = allAssets.find(asset => {
        // For testnet (anything that's not penumbra-1), use UM as denominator
        if (chainId !== 'penumbra-1') {
            return asset.symbol === 'UM';
        }
        // For mainnet (penumbra-1), use USDC as denominator
        return asset.symbol === 'USDC';
    });

    if (!baseAsset) {
        return NextResponse.json({ error: 'Base asset not found in registry' }, { status: 500 });
    }

    // Get all requested assets
    const assets = symbols
        .map(symbol => allAssets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase()))
        .filter((a): a is Metadata => a !== undefined);

    if (assets.length !== symbols.length) {
        const missingSymbols = symbols.filter(
            symbol => !assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase()),
        );
        return NextResponse.json(
            { error: `Assets not found in registry: ${missingSymbols.join(', ')}` },
            { status: 400 },
        );
    }

    // Get prices from pindexer using UM as the base asset
    const results = await pindexer.pairs({
        usdc: baseAsset.penumbraAssetId ?? new AssetId(),
        stablecoins: [baseAsset.penumbraAssetId ?? new AssetId()],
    });

    // Map results to response format
    const prices = assets.map(asset => {
        // For the base asset itself, return 1 as the price
        if (asset.symbol === baseAsset.symbol) {
            return {
                symbol: asset.symbol,
                price: 1,
            };
        }

        // Skip if either asset doesn't have an ID or inner bytes
        if (!asset.penumbraAssetId?.inner || !baseAsset.penumbraAssetId?.inner) {
            return {
                symbol: asset.symbol,
                price: null,
            };
        }

        const assetBuffer = Buffer.from(asset.penumbraAssetId.inner);
        const baseBuffer = Buffer.from(baseAsset.penumbraAssetId.inner);

        // Find direct pair with base asset
        const directPair = results.find(r => {
            return (
                (Buffer.compare(r.asset_start, assetBuffer) === 0 && Buffer.compare(r.asset_end, baseBuffer) === 0) ||
                (Buffer.compare(r.asset_start, baseBuffer) === 0 && Buffer.compare(r.asset_end, assetBuffer) === 0)
            );
        });

        if (directPair) {
            // If we're the end asset, invert the price
            // If we're the start asset, use the price directly
            const isEnd = Buffer.compare(Buffer.from(asset.penumbraAssetId.inner), directPair.asset_end) === 0;
            const price = isEnd ? 1 / directPair.price : directPair.price;
            return {
                symbol: asset.symbol,
                price,
            };
        }

        // If no route found, return null
        return {
            symbol: asset.symbol,
            price: null,
        };
    });

    return NextResponse.json(prices);
}
