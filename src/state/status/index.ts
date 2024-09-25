import { signal } from '@preact-signals/safe-react';
import { ViewService } from '@penumbra-zone/protobuf';
import { penumbra } from '@/utils/penumbra';
import { getSyncPercent } from '@/state/status/getSyncPercent';

interface StatusState {
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
}

export const penumbraStatus = signal<StatusState>();
export const penumbraStatusError = signal<string>();

/**
 * Initial status request doesn't return `latestKnownBlockHeight`.
 * Instead, it returns `catchingUp` to know if the sync is in progress
 */
const getPenumbraStatus = async (): Promise<StatusState> => {
  const status = await penumbra.service(ViewService).status({});
  return {
    syncing: status.catchingUp,
    fullSyncHeight: status.fullSyncHeight,
    latestKnownBlockHeight: status.catchingUp ? undefined : status.fullSyncHeight,
    syncPercent: status.catchingUp ? 0 : 1,
    syncPercentStringified: status.catchingUp ? '0%' : '100%',
  };
};

/**
 * Receives the status stream from the view service
 * and stores it in the `penumbraStatus` signal.
 */
export const streamPenumbraStatus = async () => {
  try {
    penumbraStatus.value = await getPenumbraStatus();
    penumbraStatusError.value = undefined;

    const stream = penumbra.service(ViewService).statusStream({});
    for await (const status of stream) {
      const syncPercents = getSyncPercent(status.fullSyncHeight, status.latestKnownBlockHeight);

      penumbraStatusError.value = undefined;
      penumbraStatus.value = {
        syncing: status.fullSyncHeight !== status.latestKnownBlockHeight,
        fullSyncHeight: status.fullSyncHeight,
        latestKnownBlockHeight: status.latestKnownBlockHeight,
        ...syncPercents,
      };
    }
  } catch (error) {
    penumbraStatus.value = undefined;
    penumbraStatusError.value = error instanceof Error ? `${error.name}: ${error.message}` : 'Streaming error';
    setTimeout(() => void streamPenumbraStatus(), 1000);
  }
};
