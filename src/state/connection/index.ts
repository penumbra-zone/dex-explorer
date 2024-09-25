import { signal } from '@preact-signals/safe-react';
import { PenumbraRequestFailure, PenumbraState, PenumbraManifest } from '@penumbra-zone/client';
import { penumbra, PRAX_ORIGIN } from '@/utils/penumbra';

export const providerManifest = signal<PenumbraManifest>();

export const providerConnected = signal<boolean>();

export const reconnectProvider = async () => {
  await penumbra.attach(PRAX_ORIGIN);
  if (!penumbra.connected) {
    return;
  }

  try {
    await penumbra.connect();
    providerConnected.value = true;
  } catch (error) {
    /* no-op */
  }
};

export const connectProvider = async () => {
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
};

export const disconnectProvider = async () => {
  if (!penumbra.connected) {
    return;
  }

  try {
    await penumbra.disconnect();
  } catch (error) {
    console.error(error);
  }
};

/** Call this function in the global `useEffect` hook to subscribe to provider connection change */
export const setupConnectionState = () => {
  providerManifest.value = penumbra.manifest;

  // If Prax is connected on page load, reconnect to ensure the connection is still active
  void reconnectProvider();

  penumbra.onConnectionStateChange((event) => {
    providerManifest.value = penumbra.manifest;
    providerConnected.value = event.state === PenumbraState.Connected;
  });
}
