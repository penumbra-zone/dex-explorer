import { NextRequest, NextResponse } from 'next/server';
import { pindexer } from '@/shared/database';
import { bech32m } from 'bech32';
import { TimelineApiResponse } from './types';

export async function GET(req: NextRequest): Promise<NextResponse<TimelineApiResponse>> {
    const { searchParams } = new URL(req.url);
    const positionId = searchParams.get('positionId');

    if (!positionId) {
        return NextResponse.json({ error: 'Missing required positionId' }, { status: 400 });
    }

    try {
        const decoded = bech32m.decode(positionId);
        if (decoded.prefix !== 'plpid') {
            return NextResponse.json({ error: 'Invalid position ID format' }, { status: 400 });
        }
        const positionIdBytes = Buffer.from(bech32m.fromWords(decoded.words));

        const [executions, state, withdrawals, volumeAndFees] = await Promise.all([
            pindexer.getPositionExecutionsWithReserves(positionIdBytes),
            pindexer.getPositionState(positionIdBytes),
            pindexer.getPositionWithdrawals(positionIdBytes),
            pindexer.getPositionVolumeAndFees(positionIdBytes),
        ]);

        if (!state) {
            return NextResponse.json({ error: 'Position state not found' }, { status: 404 });
        }

        return NextResponse.json({ executions: executions.items, skippedExecutions: executions.skippedRows, state, withdrawals, volumeAndFees });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
} 