import { useShallow } from 'zustand/react/shallow';
import { Progress } from '@penumbra-zone/ui/Progress';
import { useStatusState, StatusState } from '@/state/status';

const statusSelector = (state: StatusState) => ({
  loading: state.loading,
  error: state.error,
  syncPercent: state.syncPercent,
  updating: state.updating,
});

export const SyncBar = () => {
  const { loading, error, syncPercent, updating } = useStatusState(useShallow(statusSelector));

  return (
    <div className='fixed left-0 top-0 h-1 w-full'>
      {loading ? (
        <Progress value={0} loading error={Boolean(error)} />
      ) : (
        <Progress
          value={syncPercent}
          loading={updating}
          error={Boolean(error)}
        />
      )}
    </div>
  );
};
