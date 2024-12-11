import {
  AddressView,
  AddressView_Decoded,
  AddressIndex,
} from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { useQuery } from '@tanstack/react-query';
import { ViewService } from '@penumbra-zone/protobuf';
import { penumbra } from '@/shared/const/penumbra';
import { useBalances } from '@/shared/api/balances';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';

const ACCOUNT_INDEXES: number[] = [];

const fetchQuery = async (balances: BalancesResponse[]): Promise<AddressView[]> => {
  const service = penumbra.service(ViewService);

  // Include main account for fresh wallets to display address view
  ACCOUNT_INDEXES.push(0);

  for (const balance of balances) {
    if (
      balance.accountAddress?.addressView.case === 'decoded' &&
      balance.accountAddress.addressView.value.index?.account !== undefined
    ) {
      ACCOUNT_INDEXES.push(balance.accountAddress.addressView.value.index.account);
    }
  }

  // Filter by unique account indices
  const unique_account_indices = ACCOUNT_INDEXES.filter(
    (value, index, self) => self.indexOf(value) === index,
  );

  return Promise.all(
    unique_account_indices.map(async index => {
      const response = await service.addressByIndex({ addressIndex: { account: index } });

      return new AddressView({
        addressView: {
          case: 'decoded',
          value: new AddressView_Decoded({
            address: response.address,
            index: new AddressIndex({ account: index }),
          }),
        },
      });
    }),
  );
};

export const useSubaccounts = () => {
  // Query account balances from view service
  const { data: balances } = useBalances();

  return useQuery({
    queryKey: ['view-service-accounts'],
    queryFn: () => {
      return fetchQuery(balances!);
    },
  });
};
