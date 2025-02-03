import { observer } from 'mobx-react-lite';
import { connectionStore } from '@/shared/model/connection';
import { useLatestSwaps } from '../../api/latest-swaps';
import { TradesTable } from '@/pages/trade/ui/trades/table';

export const MyTrades = observer(() => {
  const { subaccount } = connectionStore;
  const { data, isLoading, error } = useLatestSwaps(subaccount);

  return <TradesTable error={error} isLoading={isLoading} data={data} />;
});
