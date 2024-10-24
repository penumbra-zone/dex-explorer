'use client';

import { useEffect } from 'react';

type StreamId = string;

interface StreamConfig {
  id: StreamId;
  enabled?: boolean;
  streamFn: (signal: AbortSignal) => Promise<void> | void;
}

interface StreamState {
  controller: AbortController;
  activeStreamCount: number;
}

const streamStates = new Map<StreamId, StreamState>();

/**
 * A hook for managing shared gRPC streams across multiple components.
 *
 * When multiple components need to consume the same stream, this hook ensures only
 * one stream is created and shared between them. The stream is automatically cleaned up
 * when no components are using it.
 *
 * Remember that the function passed in needs to be memoized. Either defined globally or use useCallback.
 */
export const useStream = ({ id, enabled = true, streamFn }: StreamConfig) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let streamState = streamStates.get(id);
    if (!streamState) {
      streamState = { activeStreamCount: 0, controller: new AbortController() };
      streamStates.set(id, streamState);
      void streamFn(streamState.controller.signal);
    }

    // Increment active stream count
    streamState.activeStreamCount++;

    return () => {
      streamState.activeStreamCount--;

      // Only abort stream if no components are using it
      if (streamState.activeStreamCount === 0) {
        streamState.controller.abort('Stream aborting');
        streamStates.delete(id);
      }
    };
  }, [enabled, streamFn, id]);
};
