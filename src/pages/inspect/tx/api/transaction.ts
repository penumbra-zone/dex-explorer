import { useQuery } from '@tanstack/react-query';
import { Code, ConnectError, createClient } from '@connectrpc/connect';
import { generateTransactionInfo } from '@penumbra-zone/wasm/transaction';
import { TendermintProxyService } from '@penumbra-zone/protobuf';
import { getGrpcTransport } from '@/shared/api/transport';
import { TransactionInfo } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { FullViewingKey } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import {
  Transaction,
  TransactionBodyView,
  TransactionParameters,
  TransactionPerspective,
  TransactionView,
} from '@penumbra-zone/protobuf/penumbra/core/transaction/v1/transaction_pb';
import { TransactionId } from '@penumbra-zone/protobuf/penumbra/core/txhash/v1/txhash_pb';
import { hexToUint8Array } from '@penumbra-zone/types/hex';
import { txvTranslator } from './utils/transaction-view';

export const useTransactionInfo = (txHash: string) => {
  return useQuery({
    queryKey: ['transaction', txHash],
    retry: 1,
    queryFn: async () => {
      const grpc = await getGrpcTransport();
      const tendermintClient = createClient(TendermintProxyService, grpc.transport);

      const hash = hexToUint8Array(txHash);
      // query tendermint for public info on the transaction
      const res = await tendermintClient.getTx({ hash });

      console.log('TCL: useTransactionInfo -> res', res);
      // if (!res) {
      //   throw new ConnectError('Transaction not available', Code.NotFound);
      // }
      const { tx, height } = res;

      const transaction = Transaction.fromBinary(tx);
      console.log('TCL: useTransactionInfo -> transaction', transaction);
      console.log('TCL: useTransactionInfo -> res', res);

      // const { txp: perspective, txv } = await generateTransactionInfo(
      //   new FullViewingKey({
      //     inner: new Uint8Array(32),
      //   }),
      //   transaction,
      //   {
      //     name: '',
      //     version: 0,
      //     tables: {},
      //   },
      // ).catch(e => {
      //   console.log('TCL: useTransactionInfo -> e', e);
      // });
      // console.log('TCL: useTransactionInfo -> txv', txv);
      // console.log('TCL: useTransactionInfo -> perspective', perspective);

      // Invoke a higher-level translator on the transaction view.
      // const view = txvTranslator(
      //   new TransactionView({
      //     bodyView: new TransactionBodyView({
      //       actionViews: [],
      //       transactionParameters: new TransactionParameters({
      //         case: 'transfer',
      //         value: new TransferBodyView({
      //           inputs: [],
      //           outputs: [],
      //         }),
      //       }),
      //     }),
      //   }),
      // );
      // console.log('TCL: useTransactionInfo -> view', view);

      const txInfo = new TransactionInfo({
        height,
        id: new TransactionId({ inner: hash }),
        transaction,
        // perspective: new TransactionPerspective({
        //   transactionId: new TransactionId({ inner: hash }),
        // }),
        view: new TransactionView(),
      });
      return txInfo;
    },
    enabled: !!txHash,
  });
};
