import { observer } from 'mobx-react-lite';
import { connectionStore } from '@/shared/model/connection';
import { ConnectButton } from '@/features/connect/connect-button';
import { SubaccountSelector } from '@/widgets/header/ui/subaccount-selector';

export const Connection = observer(() => {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-4'>
        {!connectionStore.connected ? <ConnectButton /> : <SubaccountSelector />}
      </div>
    </div>
  );
});
