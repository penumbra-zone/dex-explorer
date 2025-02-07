import { useQuery } from '@tanstack/react-query';
import { createClient } from '@connectrpc/connect';
import { ViewService, TendermintProxyService } from '@penumbra-zone/protobuf';
import { getGrpcTransport } from '@/shared/api/transport';
import { TransactionInfo } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import {
  ActionView,
  MemoView,
  MemoView_Opaque,
  Transaction,
  TransactionBodyView,
  TransactionPerspective,
  TransactionView,
} from '@penumbra-zone/protobuf/penumbra/core/transaction/v1/transaction_pb';
import { TransactionId } from '@penumbra-zone/protobuf/penumbra/core/txhash/v1/txhash_pb';
import { hexToUint8Array } from '@penumbra-zone/types/hex';
import {
  OutputView,
  OutputView_Opaque,
  SpendView,
  SpendView_Opaque,
} from '@penumbra-zone/protobuf/penumbra/core/component/shielded_pool/v1/shielded_pool_pb';
import {
  DelegatorVoteView,
  DelegatorVoteView_Opaque,
} from '@penumbra-zone/protobuf/penumbra/core/component/governance/v1/governance_pb';
import {
  PositionClose,
  PositionOpen,
  PositionWithdraw,
  SwapClaimView,
  SwapClaimView_Opaque,
  SwapView,
  SwapView_Opaque,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';

const actionValueViewByCase = {
  spend: SpendView,
  output: OutputView,
  swap: SwapView,
  swapClaim: SwapClaimView,
  // ics20Withdrawal: Ics20WithdrawalView,
  // ics20Deposit: Ics20DepositView,
  // delegate: DelegateView,
  // undelegate: UndelegateView,
  // undelegateClaim: UndelegateClaimView,
  // actionDutchAuctionSchedule: ActionDutchAuctionScheduleView,
  // actionDutchAuctionWithdraw: ActionDutchAuctionWithdrawView,
  // actionDutchAuctionEnd: ActionDutchAuctionEndView,
  // delegatorVote: DelegatorVoteView,
  // validatorVote: ValidatorVoteView,
  positionOpen: PositionOpen,
  positionClose: PositionClose,
  positionWithdraw: PositionWithdraw,
  // validatorDefinition: ValidatorDefinitionView,
  // ibcRelayAction: IbcRelayActionView,
  // proposalSubmit: ProposalSubmitView,
  // proposalWithdraw: ProposalWithdrawView,
  // proposalDepositClaim: ProposalDepositClaimView,
  // communityPoolSpend: CommunityPoolSpendView,
  // communityPoolOutput: CommunityPoolOutputView,
  // communityPoolDeposit: CommunityPoolDepositView,
};

const actionValueViewOpaqueByCase = {
  spend: SpendView_Opaque,
  output: OutputView_Opaque,
  swap: SwapView_Opaque,
  swapClaim: SwapClaimView_Opaque,
  delegatorVote: DelegatorVoteView_Opaque,
};

export const useTransactionInfo = (txHash: string, connected: boolean) => {
  return useQuery({
    queryKey: ['transaction', txHash, connected],
    retry: 1,
    queryFn: async () => {
      const grpc = await getGrpcTransport();
      const hash = hexToUint8Array(txHash);

      if (connected) {
        const client = createClient(ViewService, grpc.transport);
        const viewServiceRes = await client.transactionInfoByHash({
          id: new TransactionId({
            inner: hash,
          }),
        });
        return viewServiceRes.txInfo;
      }

      const tendermintClient = createClient(TendermintProxyService, grpc.transport);
      const res = await tendermintClient.getTx({ hash });

      const { tx, height } = res;

      const transaction = Transaction.fromBinary(tx);
      console.log('TCL: useTransactionInfo -> transaction', transaction);

      const txInfo = new TransactionInfo({
        height,
        id: new TransactionId({ inner: hash }),
        transaction,
        perspective: new TransactionPerspective({
          transactionId: new TransactionId({ inner: hash }),
        }),
        view: new TransactionView({
          anchor: transaction.anchor,
          bindingSig: transaction.bindingSig,
          bodyView: new TransactionBodyView({
            actionViews: transaction.body?.actions
              .map(action => {
                const { case: actionCase, value } = action.action;

                if (value.proof) {
                  const ActionValueView = actionValueViewByCase[actionCase];
                  const ActionValueView_Opaque = actionValueViewOpaqueByCase[actionCase];

                  if (!ActionValueView) {
                    return null;
                  }

                  return new ActionView({
                    actionView: {
                      case: actionCase,
                      value: new ActionValueView({
                        spendView: {
                          case: 'opaque',
                          value: new ActionValueView_Opaque({}),
                        },
                      }),
                    },
                  });
                } else {
                  return new ActionView({
                    actionView: {
                      case: actionCase,
                      value,
                    },
                  });
                }
              })
              .filter(Boolean),
            transactionParameters: transaction.body?.transactionParameters,
            detectionData: transaction.body?.detectionData,
            memoView: new MemoView({
              memoView: {
                case: 'opaque',
                value: new MemoView_Opaque({}),
              },
            }),
          }),
        }),
      });
      return txInfo;
    },
    enabled: !!txHash,
  });
};
