import { useQuery } from '@tanstack/react-query';
import { PositionTimelineResponse } from '@/shared/api/server/position/timeline/types';

export const useLpPosition = (id: string) => {
    return useQuery({
        queryKey: ['lpPosition', id],
        queryFn: async () => {
            const res = await fetch(`/api/position/timeline?positionId=${id}`);
            if (!res.ok) {
                throw new Error('Failed to fetch position executions');
            }
            const data = await res.json();
            if ('error' in data) {
                throw new Error(data.error);
            }

            return data as PositionTimelineResponse;
        },
    });
};