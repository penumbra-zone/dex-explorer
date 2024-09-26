import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { StatusState, useStatusState } from './status';
import { ConnectionState, useConnectionState } from './connection';

const connectionSelector = (state: ConnectionState) => ({
  connected: state.connected,
  setupConnection: state.setup,
});

const statusSelector = (state: StatusState) => ({
  setupStatus: state.setup,
});

/**
 * Initiates the global state and subscribes to any constant state updates.
 * Call it in the root `useEffect` hook.
 */
export const useGlobalState = () => {
  const { connected, setupConnection } = useConnectionState(useShallow(connectionSelector));
  const { setupStatus } = useStatusState(useShallow(statusSelector));

  // Subscribe to the connection change
  useEffect(() => {
    setupConnection();
  }, [setupConnection]);

  // Subscribe to the sync status
  useEffect(() => {
    if (connected) {
      void setupStatus();
    }
  }, [connected, setupStatus]);
};
