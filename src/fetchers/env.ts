import { useQuery } from '@tanstack/react-query';
import { ClientEnv } from '@/utils/env/types';

export const useEnv = () => {
  return useQuery({
    queryKey: ['clientEnv'],
    queryFn: async (): Promise<ClientEnv> => {
      return fetch('/api/env').then(resp => resp.json() as unknown as ClientEnv);
    },
    staleTime: Infinity,
  });
};
