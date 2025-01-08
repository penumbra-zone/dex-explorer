import { NextRequest, NextResponse } from 'next/server';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { pindexer } from '@/shared/database';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

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

    console.log('Requested symbols:', symbols);

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

    // Helper function to convert decimal array to hex string
    const toHex = (arr?: Uint8Array) => {
        if (!arr) return '';
        return Buffer.from(arr).toString('hex');
    };

    // Get the stablecoin (TestUSD for testnet, USDC for mainnet)
    const stablecoin = allAssets.find(asset => {
        if (chainId !== 'penumbra-1') {
            return asset.symbol === 'TestUSD';
        }
        return asset.symbol === 'USDC';
    });

    if (!stablecoin) {
        return NextResponse.json({ error: 'Stablecoin not found in registry' }, { status: 500 });
    }

    // Get prices from pindexer using the base asset (UM)
    const results = await pindexer.pairs({
        usdc: baseAsset.penumbraAssetId ?? new AssetId(),
        stablecoins: [baseAsset.penumbraAssetId ?? new AssetId()],
    });

    // Map asset IDs to symbols for easier lookup
    const assetIdToSymbol = new Map<string, string>();
    allAssets.forEach(asset => {
        const hex = toHex(asset.penumbraAssetId?.inner);
        if (hex) {
            assetIdToSymbol.set(hex, asset.symbol);
        }
    });

    console.log('Base asset:', baseAsset.symbol);
    console.log('Pairs data:', results.map(r => ({
        start_symbol: assetIdToSymbol.get(r.asset_start.toString('hex')),
        end_symbol: assetIdToSymbol.get(r.asset_end.toString('hex')),
        price: r.price
    })));

    // Map results to response format
    const response: PriceResponse[] = assets.map(asset => {
        const assetIdHex = toHex(asset.penumbraAssetId?.inner);

        if (asset.symbol === 'TestUSD') {
            console.log('Processing TestUSD:');
            console.log('TestUSD asset ID:', assetIdHex);
            console.log('Base asset (UM) ID:', toHex(baseAsset.penumbraAssetId?.inner));
        }

        // For the base asset itself, return 1 as the price
        if (asset.symbol === baseAsset.symbol) {
            return {
                symbol: asset.symbol,
                price: 1,
            };
        }

        // Find direct pair with base asset
        const baseAssetHex = toHex(baseAsset.penumbraAssetId?.inner);
        const directPair = results.find(
            r => {
                const startHex = r.asset_start.toString('hex');
                const endHex = r.asset_end.toString('hex');

                if (asset.symbol === 'TestUSD') {
                    console.log('Checking pair:');
                    console.log('- Start:', startHex, assetIdToSymbol.get(startHex));
                    console.log('- End:', endHex, assetIdToSymbol.get(endHex));
                    console.log('- Price:', r.price);
                }

                return (
                    (startHex === assetIdHex && endHex === baseAssetHex) ||
                    (startHex === baseAssetHex && endHex === assetIdHex)
                );
            }
        );

        if (directPair) {
            // If the asset is the end asset, we need to invert the price
            const isEnd = assetIdHex === directPair.asset_end.toString('hex');
            const price = isEnd ? 1 / directPair.price : directPair.price;
            if (asset.symbol === 'TestUSD') {
                console.log('Found direct pair for TestUSD:');
                console.log('- Is end asset?', isEnd);
                console.log('- Raw price:', directPair.price);
                console.log('- Final price:', isEnd ? 1 / directPair.price : directPair.price);
            }
            return {
                symbol: asset.symbol,
                price,
            };
        }

        // If no direct pair found, try to find a route through TestUSD
        const testUsdAsset = allAssets.find(a => a.symbol === 'TestUSD');
        if (testUsdAsset?.penumbraAssetId) {
            const testUsdHex = toHex(testUsdAsset.penumbraAssetId.inner);

            // Find Asset/TestUSD pair
            const assetTestUsdPair = results.find(
                r => {
                    const startHex = r.asset_start.toString('hex');
                    const endHex = r.asset_end.toString('hex');
                    return (
                        (startHex === assetIdHex && endHex === testUsdHex) ||
                        (startHex === testUsdHex && endHex === assetIdHex)
                    );
                }
            );

            // Find TestUSD/UM pair
            const testUsdUmPair = results.find(
                r => {
                    const startHex = r.asset_start.toString('hex');
                    const endHex = r.asset_end.toString('hex');
                    return (
                        (startHex === testUsdHex && endHex === baseAssetHex) ||
                        (startHex === baseAssetHex && endHex === testUsdHex)
                    );
                }
            );

            if (assetTestUsdPair && testUsdUmPair) {
                // Calculate price through TestUSD
                const assetToTestUsd = assetIdHex === assetTestUsdPair.asset_end.toString('hex')
                    ? 1 / assetTestUsdPair.price
                    : assetTestUsdPair.price;

                const testUsdToUm = testUsdHex === testUsdUmPair.asset_end.toString('hex')
                    ? 1 / testUsdUmPair.price
                    : testUsdUmPair.price;

                const price = assetToTestUsd * testUsdToUm;
                console.log(`Indirect pair for ${asset.symbol} through TestUSD: ${price}`);
                return {
                    symbol: asset.symbol,
                    price,
                };
            }
        }

        // If no route found, return null
        console.log(`No route found for ${asset.symbol}`);
        return {
            symbol: asset.symbol,
            price: null,
        };
    });

    return NextResponse.json(response);
} 