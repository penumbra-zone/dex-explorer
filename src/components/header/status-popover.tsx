import { useMemo } from 'react';
import { Blocks } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Popover } from '@penumbra-zone/ui/Popover';
import { Button } from '@penumbra-zone/ui/Button';
import { Density } from '@penumbra-zone/ui/Density';
import { Pill } from '@penumbra-zone/ui/Pill';
import { Text } from '@penumbra-zone/ui/Text';
import { useStatusState, StatusState } from '@/state/status';
import { useConnected } from '@/state/connection';

const statusSelector = (state: StatusState) => ({
  loading: state.loading,
  error: state.error,
  syncing: state.syncing,
  latestKnownBlockHeight: state.latestKnownBlockHeight,
  fullSyncHeight: state.fullSyncHeight,
});

export const StatusPopover = () => {
  const { loading, error, syncing, fullSyncHeight, latestKnownBlockHeight } = useStatusState(useShallow(statusSelector));
  const connected = useConnected();

  // a ReactNode displaying the sync status in form of a pill
  const pill = useMemo(() => {
    if (error) {
      return <Pill context='technical-destructive'>Block Sync Error</Pill>;
    }

    if (loading) {
      return null;
    }

    if (!syncing) {
      return <Pill context='technical-success'>Blocks Synced</Pill>;
    }

    return <Pill context='technical-caution'>Block Syncing</Pill>;
  }, [error, loading, syncing]);

  if (!connected) {
    return null;
  }

  return (
    <Popover>
      <Popover.Trigger>
        <Button icon={Blocks} iconOnly>
          Status
        </Button>
      </Popover.Trigger>
      <Popover.Content align='end' side='bottom'>
        <Density compact>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <Text technical>Status</Text>
              {pill}
              {error}
            </div>
            {!loading && (
              <div className='flex flex-col gap-2'>
                <Text technical>Block Height</Text>
                <Pill context='technical-default'>
                  {latestKnownBlockHeight !== fullSyncHeight
                    ? `${fullSyncHeight} of ${latestKnownBlockHeight}`
                    : `${latestKnownBlockHeight}`}
                </Pill>
              </div>
            )}
          </div>
        </Density>
      </Popover.Content>
    </Popover>
  );
};
