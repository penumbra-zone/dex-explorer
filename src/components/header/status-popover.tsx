import { useEffect } from 'react';
import { Blocks } from 'lucide-react';
import { useComputed } from '@preact-signals/safe-react';
import { Popover } from '@penumbra-zone/ui/Popover';
import { Button } from '@penumbra-zone/ui/Button';
import { Density } from '@penumbra-zone/ui/Density';
import { Pill } from '@penumbra-zone/ui/Pill';
import { Text } from '@penumbra-zone/ui/Text';
import { penumbraStatus, penumbraStatusError, streamPenumbraStatus } from '@/state/status';
import { useConnect } from '@/utils/penumbra/useConnect.ts';

export const StatusPopover = () => {
  const { connected } = useConnect();

  // a ReactNode displaying the sync status in form of a pill
  const pill = useComputed(() => {
    if (penumbraStatusError.value) {
      return <Pill context='technical-destructive'>Block Sync Error</Pill>;
    }

    if (!penumbraStatus.value) {
      return null;
    }

    if (!penumbraStatus.value.syncing) {
      return <Pill context='technical-success'>Blocks Synced</Pill>;
    }

    return <Pill context='technical-caution'>Block Syncing</Pill>;
  });

  useEffect(() => {
    if (connected) {
      void streamPenumbraStatus();
    }
  }, [connected]);

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
              {pill.value}
              {penumbraStatusError.value}
            </div>
            {penumbraStatus.value && (
              <div className='flex flex-col gap-2'>
                <Text technical>Block Height</Text>
                <Pill context='technical-default'>
                  {penumbraStatus.value.latestKnownBlockHeight !== penumbraStatus.value.fullSyncHeight
                    ? `${penumbraStatus.value.fullSyncHeight} of ${penumbraStatus.value.latestKnownBlockHeight}`
                    : `${penumbraStatus.value.latestKnownBlockHeight}`}
                </Pill>
              </div>
            )}
          </div>
        </Density>
      </Popover.Content>
    </Popover>
  );
};
