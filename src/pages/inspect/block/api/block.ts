import { useQuery } from '@tanstack/react-query';
import { BlockSummaryApiResponse } from '@/shared/api/server/block/types';

export const useBlockSummary = (height: string) => {
  return useQuery({
    queryKey: ['block', height],
    retry: 1,
    queryFn: async (): Promise<BlockSummaryApiResponse> => {
      const response = await fetch(`/api/block/${height}`);
      return response.json() as Promise<BlockSummaryApiResponse>;
    },
  });
};
