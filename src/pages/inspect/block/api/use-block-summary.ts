import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/utils/api-fetch';
import { BlockSummaryData } from './types';

export const useBlockSummary = (height: string) => {
  return useQuery({
    queryKey: ['block-summary', height],
    enabled: Boolean(height),
    retry: 1,
    queryFn: async () => {
      return apiFetch<BlockSummaryData>(`/api/block/${height}`);
    },
  });
}; 