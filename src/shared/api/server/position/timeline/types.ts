import { Selectable } from 'kysely';
import { DexExPositionWithdrawals } from '@/shared/database/schema';
import { ExecutionWithReserves, PositionStateWithReserves, VolumeAndFees } from '@/shared/database';

export interface PositionTimelineResponse {
    executions: ExecutionWithReserves[];
    skippedExecutions: number;
    state: PositionStateWithReserves;
    withdrawals: Selectable<DexExPositionWithdrawals>[];
    volumeAndFees: VolumeAndFees[];
}

export type TimelineApiResponse = PositionTimelineResponse | { error: string }; 