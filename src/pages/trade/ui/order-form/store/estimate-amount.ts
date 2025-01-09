import { SimulateTradeRequest } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { createClient } from '@connectrpc/connect';
import { SimulationService } from '@penumbra-zone/protobuf';
import { pnum } from '@penumbra-zone/types/pnum';
import { openToast } from '@penumbra-zone/ui/Toast';
import { penumbra } from '@/shared/const/penumbra';
import { connectionStore } from '@/shared/model/connection';
import { getGrpcTransport } from '@/shared/api/transport';
import { AssetInfo } from '../../../model/AssetInfo';

/**
 * Simulates the transaction with given input and output assets.
 * Works for both connected and disconnected accounts but must be used within MobX store.
 */
export const estimateAmount = async (
  from: AssetInfo,
  to: AssetInfo,
  input: number,
): Promise<number | undefined> => {
  try {
    const grpc = !connectionStore.connected ? await getGrpcTransport() : undefined;

    const req = new SimulateTradeRequest({
      input: from.value(input),
      output: to.id,
    });

    const res = grpc
      ? await createClient(SimulationService, grpc.transport).simulateTrade(req)
      : await penumbra.service(SimulationService).simulateTrade(req);

    const amount = res.output?.output?.amount;
    if (amount === undefined) {
      throw new Error('Amount returned from swap simulation was undefined');
    }
    return pnum(amount, to.exponent).toNumber();
  } catch (e) {
    if (
      e instanceof Error &&
      ![
        'ConnectError',
        'PenumbraNotInstalledError',
        'PenumbraProviderNotAvailableError',
        'PenumbraProviderNotConnectedError',
      ].includes(e.name)
    ) {
      openToast({
        type: 'error',
        message: e.name,
        description: e.message,
      });
    }
    return undefined;
  }
};
