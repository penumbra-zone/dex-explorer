import { useQuery } from '@tanstack/react-query';
import { TransactionInfo } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { ViewService } from '@penumbra-zone/protobuf';
import { penumbra } from '@/shared/const/penumbra';

export const useTransactions = (subaccount?: number = 0) => {
  return useQuery<TransactionInfo[]>({
    queryKey: ['txs', subaccount],
    queryFn: async () => {
      const txs = await Array.fromAsync(penumbra.service(ViewService).transactionInfo({}));

      // Filters and maps the array at the same time
      return txs.reduce<TransactionInfo[]>((accum, tx) => {
        // TODO: Filter out transactions that don't belong to the current subaccount.
        if (!tx.txInfo) {
          return accum;
        }
        accum.push(tx.txInfo);
        return accum;
      }, []);
    },
  });
};
