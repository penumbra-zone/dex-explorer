import { Progress } from '@penumbra-zone/ui/Progress';
import { penumbraStatus, penumbraStatusError } from '@/state/status';

export const SyncBar = () => {
  return (
    <div className='fixed left-0 top-0 h-1 w-full'>
      {!penumbraStatus.value ? (
        <Progress value={0} loading />
      ) : (
        <Progress
          value={penumbraStatus.value.syncPercent ?? 0}
          loading={penumbraStatus.value.updating}
          error={Boolean(penumbraStatusError.value)}
        />
      )}
    </div>
  );
};
