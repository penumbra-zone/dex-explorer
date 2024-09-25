import { useEffect } from 'react';
import { effect } from '@preact-signals/safe-react';
import { streamPenumbraStatus } from './status';
import { providerConnected, setupConnectionState } from './connection';

/**
 * Initiates the global state and subscribes to any constant state updates.
 * Call it in the root `useEffect` hook.
 */
export const useGlobalState = () => {
  // Subscribe to the connection change
  useEffect(() => {
    setupConnectionState();
  }, []);

  effect(() => {
    if (providerConnected.value) {
      // Subscribe to the status stream
      void streamPenumbraStatus();
    }
  });
};
