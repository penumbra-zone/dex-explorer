import { Progress } from '@penumbra-zone/ui/Progress';
import { statusStore } from '@/shared/state/status';
import { observer } from 'mobx-react-lite';
import { useLatestBlockHeight } from '@/shared/state/compactBlock.ts';

export const SyncBar = observer(() => {
  const { loading, error, syncPercent, updating } = statusStore;

  const { data } = useLatestBlockHeight();
  console.log('in component A', data);

  return (
    <div className='fixed left-0 top-0 h-1 w-full'>
      {loading ? (
        <Progress value={0} loading error={Boolean(error)} />
      ) : (
        <Progress value={syncPercent} loading={updating} error={Boolean(error)} />
      )}
    </div>
  );
});
