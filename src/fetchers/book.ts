import { useQuery } from '@tanstack/react-query';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

export const useBook = (symbol1: string, symbol2: string, limit: number) => {
  return useQuery({
    queryKey: ['book'],
    queryFn: async (): Promise<Position[]> => {
      const res = await fetch(`/api/book/${symbol1}/${symbol2}/${limit}`);
      return (await res.json()) as Position[];
    },
    staleTime: Infinity,
  });
};
