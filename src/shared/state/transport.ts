import { connectionStore } from '@/shared/state/connection';
import { Transport } from '@connectrpc/connect';
import { penumbra } from '@/shared/penumbra.ts';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { sample } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { useEnv } from '@/fetchers/env.ts';
import { ViewService } from '@penumbra-zone/protobuf/penumbra/view/v1/view_connect';

enum TransportType {
  PRAX,
  GRPC_WEB,
}

// Verifies that the Dex explorer backend chain id matches the one Prax is connected to
const useWalletOnWrongChain = () => {
  const { data: env } = useEnv();

  const { data: chainId } = useQuery({
    queryKey: ['appParameters'],
    queryFn: async () => {
      const { parameters } = await penumbra.service(ViewService).appParameters({});
      return parameters?.chainId;
    },
    staleTime: Infinity,
    enabled: connectionStore.connected,
  });

  return !!env && !!chainId && env.PENUMBRA_CHAIN_ID !== chainId;
};

const useRpcChoices = () => {
  const { data: env, isLoading: envIsLoading, error: envError } = useEnv();

  const res = useQuery({
    queryKey: ['useRpcChoices', env?.PENUMBRA_CHAIN_ID],
    queryFn: async () => {
      if (env?.PENUMBRA_CHAIN_ID === 'penumbra-1') {
        const chainRegistryClient = new ChainRegistryClient();
        const { rpcs } = await chainRegistryClient.remote.globals();
        return rpcs.map(r => r.url);
      } else if (env?.PENUMBRA_CHAIN_ID === 'penumbra-testnet-phobos-2') {
        return ['https://testnet.plinfra.net'];
      } else {
        throw new Error(`No rpcs for chain id: ${env?.PENUMBRA_CHAIN_ID}`);
      }
    },
    enabled: !!env,
    staleTime: Infinity,
  });

  return {
    ...res,
    isLoading: envIsLoading || res.isLoading,
    error: envError ?? res.error,
  };
};

export const useGrpcTransport = () => {
  const wrongChain = useWalletOnWrongChain();
  if (wrongChain) {
    alert('Prax connected to wrong chain id, please update your RPC');
  }

  const { data: rpcChoices, isLoading: rpcIsLoading, error: rpcError } = useRpcChoices();

  const res = useQuery({
    queryKey: ['grpcTransport', connectionStore.connected, rpcChoices],
    queryFn: (): { transport: Transport; type: TransportType } => {
      if (connectionStore.connected && penumbra.transport) {
        console.log('transport from prax');
        return { transport: penumbra.transport, type: TransportType.PRAX };
      }

      const randomRpc = sample(rpcChoices);
      if (!randomRpc) {
        throw new Error('No rpcs in remote globals');
      }

      return {
        transport: createGrpcWebTransport({
          baseUrl: randomRpc,
        }),
        type: TransportType.GRPC_WEB,
      };
    },
    enabled: !!rpcChoices,
    staleTime: Infinity,
  });

  return {
    ...res,
    isLoading: rpcIsLoading || res.isLoading,
    error: rpcError ?? res.error,
  };
};
