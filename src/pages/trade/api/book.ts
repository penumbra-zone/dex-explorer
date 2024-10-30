import { useQuery } from '@tanstack/react-query';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { JsonValue } from '@bufbuild/protobuf';
import { useRefetchOnNewBlock } from '@/shared/api/compact-block.ts';
import {
  deserializeRouteBookResponseJson,
  RouteBookResponse,
  RouteBookResponseJson,
} from '@/shared/api/server/booktwo.ts';

interface BookResponse {
  asks: Position[];
  bids: Position[];
}

interface BookResponseJson {
  asks: JsonValue[];
  bids: JsonValue[];
}

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
      const baseUrl = '/api/booktwo';
      const urlParams = new URLSearchParams(paramsObj).toString();
      const res = await fetch(`${baseUrl}?${urlParams}`);
      const data = (await res.json()) as RouteBookResponseJson;
      return deserializeRouteBookResponseJson(data);
    },
    enabled: !!symbol1 && !!symbol2,
  });

  useRefetchOnNewBlock(query);

  return query;
};
