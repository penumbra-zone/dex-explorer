import { useQuery } from '@tanstack/react-query';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

interface BookResponse {
  asks: Position[];
  bids: Position[];
}

export const useBook = (
  symbol1: string | undefined,
  symbol2: string | undefined,
  hops: number | undefined,
  limit: number | undefined,
) => {
  return useQuery({
    queryKey: ['book', symbol1, symbol2, hops, limit],
    queryFn: async (): Promise<BookResponse> => {
      if (!symbol1 || !symbol2 || !limit) {
        return {
          asks: [],
          bids: [],
        };
      }
      const res = await fetch(`/api/book/${symbol1}/${symbol2}/${hops}/${limit}`);
      return (await res.json()) as BookResponse;
    },
    staleTime: Infinity,
  });
};
