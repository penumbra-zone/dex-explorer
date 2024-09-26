import { create } from 'zustand';
import { PenumbraRequestFailure, PenumbraState, PenumbraManifest } from '@penumbra-zone/client';
import { penumbra, PRAX_ORIGIN } from '@/utils/penumbra';

export interface ConnectionState {
  connected: boolean;
  manifest: PenumbraManifest | undefined;
  reconnect: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Call this function in the global `useEffect` hook to subscribe to provider connection change */
  setup: () => void;
}

export const useConnectionState = create<ConnectionState>()((set, get) => ({
  connected: false,
  manifest: undefined,

  reconnect: async () => {
    await penumbra.attach(PRAX_ORIGIN);
    if (!penumbra.connected) {
      return;
    }

    try {
      await penumbra.connect();
      set({ connected: true });
    } catch (error) {
      /* no-op */
    }
  },

  connect: async () => {
    try {
      await penumbra.connect();
    } catch (error) {
      if (error instanceof Error && error.cause) {
        if (error.cause === PenumbraRequestFailure.Denied) {
          // TODO: replace these alerts with toasts
          alert('Connection denied: you may need to un-ignore this site in your extension settings.');
        }
        if (error.cause === PenumbraRequestFailure.NeedsLogin) {
          alert('Not logged in: please login into the extension and try again');
        }
      }
    }
  },

  disconnect: async () => {
    if (!penumbra.connected) {
      return;
    }

    try {
      await penumbra.disconnect();
    } catch (error) {
      console.error(error);
    }
  },

  setup: () => {
    set({ manifest: penumbra.manifest });

    // If Prax is connected on page load, reconnect to ensure the connection is still active
    void get().reconnect();

    penumbra.onConnectionStateChange((event) => {
      set({
        manifest: penumbra.manifest,
        connected: event.state === PenumbraState.Connected,
      });
    });
  },
}));

export const useConnected = () => useConnectionState((state) => state.connected);
