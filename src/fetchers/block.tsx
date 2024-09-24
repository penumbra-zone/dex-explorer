import { useQuery } from '@tanstack/react-query';
import { BlockInfo } from '@/utils/indexer/types/lps';

export const useBlockInfo = (startHeight: number | string, endHeight: number | string) => {
  return useQuery({
    queryKey: ['blockInfo'],
    queryFn: async (): Promise<BlockInfo[]> => {
      return (await fetch(`/api/blocks/${startHeight}/${endHeight}`).then(res =>
        res.json(),
      )) as BlockInfo[];
    },
  });
};
