import { useShallow } from 'zustand/react/shallow';
import { Button } from '@penumbra-zone/ui/Button';
import { ConnectionState, useConnectionState } from '@/state/connection';
import { ProviderPopover } from './provider-popover';

const connectionSelector = (state: ConnectionState) => ({
  connected: state.connected,
  connect: state.connect,
});

export const Connection = () => {
  const { connected, connect } = useConnectionState(useShallow(connectionSelector));

  if (!connected) {
    return (
      <Button actionType='accent' onClick={() => void connect()}>Connect</Button>
    );
  }

  return <ProviderPopover />
};
