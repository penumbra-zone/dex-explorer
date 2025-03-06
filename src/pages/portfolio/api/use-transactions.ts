import { useQuery } from '@tanstack/react-query';
import { TransactionInfo } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { ViewService } from '@penumbra-zone/protobuf';
import { getAddressIndex } from '@penumbra-zone/getters/address-view';
import { penumbra } from '@/shared/const/penumbra';

export const useTransactions = (subaccount = 0) => {
  return useQuery<TransactionInfo[]>({
    queryKey: ['txs', subaccount],
    queryFn: async () => {
      const txs = await Array.fromAsync(penumbra.service(ViewService).transactionInfo({}));

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
