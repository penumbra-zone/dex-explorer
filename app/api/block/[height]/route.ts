import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { serialize } from '@/shared/utils/serializer';
import { pnum } from '@penumbra-zone/types/pnum';

export async function GET(
    req: NextRequest,
    { params }: { params: { height: string } },
): Promise<NextResponse> {
    try {
        if (!params.height) {
            return NextResponse.json({ error: 'Block height is required' }, { status: 400 });
        }

        const height = Number(params.height);
        if (isNaN(height) || height < 0 || !Number.isInteger(height)) {
            return NextResponse.json({ error: 'Invalid block height' }, { status: 400 });
        }

        const grpcEndpoint = process.env['PENUMBRA_GRPC_ENDPOINT'];
        if (!grpcEndpoint) {
            return NextResponse.json({ error: 'PENUMBRA_GRPC_ENDPOINT is not set' }, { status: 500 });
        }

        // Get block data from both pindexer and ViewService
        const [block, transactions, batchSwaps] = await Promise.all([
            pindexer.block(height),
            pindexer.blockTransactions(height),
            pindexer.blockBatchSwaps(height),
        ]);

        if (!block) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        }

        // Calculate total volume and fees
        let totalVolume = 0n;
        const totalFees = 0n;
        for (const swap of batchSwaps) {
            if (swap.direct_volume) { totalVolume += BigInt(Math.floor(swap.direct_volume)); }
            if (swap.swap_volume) { totalVolume += BigInt(Math.floor(swap.swap_volume)); }
        }

        const summary = {
            height: Number(block.height),
            timestamp: block.timestamp.toISOString(),
            totalTransactions: transactions.length,
            totalVolume: pnum(totalVolume).toValueView(),
            totalFees: pnum(totalFees).toValueView(),
            totalBatchSwaps: batchSwaps.length,
        };

        return NextResponse.json(serialize(summary));
    } catch (error) {
        console.error('Error fetching block data:', error);
        return NextResponse.json(
            { error: `Error fetching block data: ${(error as Error).message}` },
            { status: 500 },
        );
    }
} 