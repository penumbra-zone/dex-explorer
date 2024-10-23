'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useGrpcTransport } from '@/shared/state/transport.ts';
import { CompactBlockService, TendermintProxyService } from '@penumbra-zone/protobuf';
import { Code, ConnectError, createPromiseClient, Transport } from '@connectrpc/connect';
import { queryClient } from '@/shared/queryClient.ts';
import { connectionStore } from '@/shared/state/connection';

const fetchLatestBlockHeight = async (transport: Transport) => {
  const tendermintClient = createPromiseClient(TendermintProxyService, transport);
  const { syncInfo } = await tendermintClient.getStatus({});
  if (!syncInfo?.latestBlockHeight) {
    throw new Error('Was not able to sync latest block height');
  }
  return Number(syncInfo.latestBlockHeight);
};

const startBlockHeightStream = async (transport: Transport, ac: AbortController) => {
  console.log('STARTING STREAM');
  try {
    const latestBlockHeight = await fetchLatestBlockHeight(transport);
    const blockClient = createPromiseClient(CompactBlockService, transport);
    for await (const response of blockClient.compactBlockRange(
      {
        startHeight: BigInt(latestBlockHeight) + 1n,
        keepAlive: true,
      },
      { signal: ac.signal },
    )) {
      if (response.compactBlock?.height) {
        const newHeight = Number(response.compactBlock.height);
        queryClient.setQueryData(['latestBlockHeight'], newHeight);
      }
    }
  } catch (error) {
    if (
      (error instanceof ConnectError && error.code === Code.Canceled) ||
      error === 'Streaming compact block aborting'
    ) {
      // Expected abort due to component unmounting, do nothing
    } else {
      console.error('Unexpected compact block streaming error:', error);
    }
  }
};

// Track stream state globally
let activeStream: AbortController | undefined;
let activeStreamCount = 0;

export const useLatestBlockHeight = () => {
  const { data, isLoading: transportIsLoading, error: transportError } = useGrpcTransport();

  const res = useQuery({
    queryKey: ['latestBlockHeight'],
    queryFn: async (): Promise<number> => {
      if (!data?.transport) {
        throw new Error('Transport not available');
      }
      return await fetchLatestBlockHeight(data.transport);
    },
    staleTime: Infinity,
    enabled: !!data?.transport,
  });

  useEffect(() => {
    if (!data?.transport) {
      return;
    }

    // Increment active stream count
    activeStreamCount++;

    // Start stream if none exists
    if (!activeStream) {
      activeStream = new AbortController();
      void startBlockHeightStream(data.transport, activeStream);
    }

    // On component unmount, cancel stream
    return () => {
      activeStreamCount--;

      // Only abort stream if no components are using it
      if (activeStreamCount === 0 && activeStream) {
        activeStream.abort('Streaming compact block aborting');
        activeStream = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- can use mobx var as component using hook is wrapped in observer()
  }, [data?.transport, connectionStore.connected]);

  return {
    ...res,
    isLoading: transportIsLoading || res.isLoading,
    error: transportError ?? res.error,
  };
};
