import { useQuery } from '@tanstack/react-query';
import { createClient } from '@connectrpc/connect';
import { ViewService } from '@penumbra-zone/protobuf';
import { getGrpcTransport } from '@/shared/api/transport';
import { TransactionId } from '@penumbra-zone/protobuf/penumbra/core/txhash/v1/txhash_pb';
import { hexToUint8Array } from '@penumbra-zone/types/hex';
import { TransactionInfoByHashResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';

export const useTransaction = (txHash: string): TransactionInfoByHashResponse => {
  return useQuery({
    queryKey: ['transaction', txHash],
    retry: 1,
    queryFn: async () => {
      const grpc = await getGrpcTransport();
      const client = createClient(ViewService, grpc.transport);
      const res = await client.transactionInfoByHash({
        id: new TransactionId({
          inner: hexToUint8Array(txHash),
        }),
      });
      return res;
    },
    enabled: !!txHash,
  });
};
