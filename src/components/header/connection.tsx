import { Button } from '@penumbra-zone/ui/Button';
import { providerConnected, connectProvider } from '@/state/connection';
import { ProviderPopover } from './provider-popover';

export const Connection = () => {
  if (!providerConnected.value) {
    return (
      <Button actionType='accent' onClick={() => void connectProvider()}>Connect</Button>
    );
  }

  return <ProviderPopover />
};
