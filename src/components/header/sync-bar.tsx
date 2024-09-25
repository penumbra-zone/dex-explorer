import { Progress } from '@penumbra-zone/ui/Progress';
import { penumbraStatus, penumbraStatusError } from '@/state/status';

export const SyncBar = () => {
  return (
    <div className='fixed left-0 top-0 h-1 w-full'>
      {!penumbraStatus.value ? (
        <Progress value={0} loading error={Boolean(penumbraStatusError.value)} />
      ) : (
        <Progress
          value={penumbraStatus.value.syncPercent}
          loading={penumbraStatus.value.updating}
          error={Boolean(penumbraStatusError.value)}
        />
      )}
    </div>
  );
};
