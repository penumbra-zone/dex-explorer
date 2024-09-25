import { useComputed } from '@preact-signals/safe-react';
import { Link2Off } from 'lucide-react';
import Image from 'next/image';
import { Popover } from '@penumbra-zone/ui/Popover';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { providerManifest, disconnectProvider } from '@/state/connection';

export const ProviderPopover = () => {
  const name = providerManifest.value?.['name'] as string;
  const version = providerManifest.value?.['version'] as string;
  const description = providerManifest.value?.['description'] as string;

  const icon = useComputed(() => {
    const icons = (providerManifest.value?.['icons'] ?? {}) as Record<string, Blob>;
    const blob = icons['32'] ?? icons['128'];
    const element = !blob ? null : (
      <Image width={16} height={16} src={URL.createObjectURL(blob)} alt={name} className='size-4' />
    );
    return () => element;
  });

  return (
    <Popover>
      <Popover.Trigger>
        <Button icon={icon.value} iconOnly>
          {name}
        </Button>
      </Popover.Trigger>
      <Popover.Content align='end' side='bottom'>
        {providerManifest.value ? (
          <div className='flex flex-col gap-2'>
            <Text body>
              {name} v{version}
            </Text>
            <Text small>{description}</Text>
          </div>
        ) : (
          <Text body>Loading provider manifest...</Text>
        )}
        <div className='mt-4'>
          <Button icon={Link2Off} onClick={() => void disconnectProvider()}>
            Disconnect
          </Button>
        </div>
      </Popover.Content>
    </Popover>
  );
};
