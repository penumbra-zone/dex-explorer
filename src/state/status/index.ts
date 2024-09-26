import { ViewService } from '@penumbra-zone/protobuf';
import { penumbra } from '@/utils/penumbra';
import { getSyncPercent } from '@/state/status/getSyncPercent';
import { create } from 'zustand/index';

export interface StatusState {
  /** If true, ignore all other state values */
  loading: boolean;
  /** The error is set in case of a request failure */
  error?: string;
  /** Indicates that the account needs syncing with the blockchain */
  syncing: boolean;
  /** Indicates that the account is almost in sync with the blockchain (amount of unsynced blocks is less than 10) */
  updating?: boolean;
  /** The amount of synced blocks */
  fullSyncHeight: bigint;
  /** The total amount of blocks in the blockchain */
  latestKnownBlockHeight?: bigint;
  /** A number between 0 and 1 indicating the sync progress */
  syncPercent: number;
  /** A stringified sync percentage, e.g. '100%' or '17%' */
  syncPercentStringified: string;

  /**
   * Receives the status stream from the view service
   * and stores it in the `penumbraStatus` signal.
   *
   * Call this function in the global `useEffect` hook to subscribe to provider connection change
   */
  setup: () => Promise<void>;
}

/**
 * Initial status request doesn't return `latestKnownBlockHeight`.
 * Instead, it returns `catchingUp` to know if the sync is in progress
 */
const getPenumbraStatus = async (): Promise<Omit<StatusState, 'setup'>> => {
  const status = await penumbra.service(ViewService).status({});

  return {
    loading: false,
    error: undefined,
    syncing: status.catchingUp,
    fullSyncHeight: status.fullSyncHeight,
    latestKnownBlockHeight: status.catchingUp ? undefined : status.fullSyncHeight,
    syncPercent: status.catchingUp ? 0 : 1,
    syncPercentStringified: status.catchingUp ? '0%' : '100%',
  };
};

export const useStatusState = create<StatusState>()((set, get) => ({
  loading: true,
  syncing: false,
  updating: false,
  fullSyncHeight: 0n,
  latestKnownBlockHeight: undefined,
  syncPercent: 0,
  syncPercentStringified: '0%',

  setup: async () => {
    try {
      set(await getPenumbraStatus());

      const stream = penumbra.service(ViewService).statusStream({});
      for await (const status of stream) {
        const syncPercents = getSyncPercent(status.fullSyncHeight, status.latestKnownBlockHeight);

        set({
          loading: false,
          error: undefined,
          syncing: status.fullSyncHeight !== status.latestKnownBlockHeight,
          fullSyncHeight: status.fullSyncHeight,
          latestKnownBlockHeight: status.latestKnownBlockHeight,
          ...syncPercents,
        });
      }
    } catch (error) {
      set({ error: error instanceof Error ? `${error.name}: ${error.message}` : 'Streaming error' });
      setTimeout(() => void get().setup(), 1000);
    }
  },
}));
