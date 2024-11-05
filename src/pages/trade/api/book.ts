import { useQuery } from '@tanstack/react-query';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block.ts';
import { RouteBookResponse } from '@/shared/api/server/book/types';
import { deserializeRouteBookResponseJson } from '@/shared/api/server/book/serialization.ts';
import { RouteBookApiResponse } from '@/shared/api/server/book';

export const useBook = (symbol1: string | undefined, symbol2: string | undefined) => {
  const query = useQuery({
    queryKey: ['book', symbol1, symbol2],
    queryFn: async (): Promise<RouteBookResponse> => {
      if (!symbol1 || !symbol2) {
        throw new Error('Missing symbols');
      }

      const paramsObj = {
        baseAsset: symbol1,
        quoteAsset: symbol2,
      };
      const baseUrl = '/api/book';
      const urlParams = new URLSearchParams(paramsObj).toString();
      const res = await fetch(`${baseUrl}?${urlParams}`);
      const jsonRes = (await res.json()) as RouteBookApiResponse;
      if ('error' in jsonRes) {
        throw new Error(jsonRes.error);
      }
      return deserializeRouteBookResponseJson(jsonRes);
    },
    enabled: !!symbol1 && !!symbol2,
  });

  useRefetchOnNewBlock(query);

  return query;
};
