import { useInfiniteQuery } from '@tanstack/react-query';
import { TransactionInfo } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { ViewService } from '@penumbra-zone/protobuf';
import { getAddressIndex } from '@penumbra-zone/getters/address-view';
import { penumbra } from '@/shared/const/penumbra';

const BASE_LIMIT = 20;
const BASE_PAGE = 0;

export const useTransactions = (subaccount = 0) => {
  return useInfiniteQuery<TransactionInfo[]>({
    queryKey: ['txs', subaccount],
    initialPageParam: BASE_PAGE,
    getNextPageParam: (lastPage, _, lastPageParam) => {
      return lastPage.length ? (lastPageParam as number) + 1 : undefined;
    },
    queryFn: async ({ pageParam }) => {
      const res = await Array.fromAsync(penumbra.service(ViewService).transactionInfo({}));

      // TODO: implement sorting by height in the ViewService, and use `limitAsync` here after it
      res.sort((a, b) => Number((b.txInfo?.height ?? 0n) - (a.txInfo?.height ?? 0n)));

      const offset = BASE_LIMIT * (pageParam as number);
      const txs = res.slice(offset, offset + BASE_LIMIT);

      // Filters and maps the array at the same time
      return txs.reduce<TransactionInfo[]>((accum, tx) => {
        const addresses = tx.txInfo?.perspective?.addressViews;

        if (
          !tx.txInfo ||
          !addresses?.some(address => getAddressIndex.optional(address)?.account === subaccount)
        ) {
          return accum;
        }

        accum.push(tx.txInfo);
        return accum;
      }, []);
    },
  });
};
