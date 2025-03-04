import { observer } from 'mobx-react-lite';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TransactionSummary } from '@penumbra-zone/ui/TransactionSummary';
import { Skeleton } from '@penumbra-zone/ui/Skeleton';
import { useTransactions } from '../api/use-transactions';
import { connectionStore } from '@/shared/model/connection';
import { useGetMetadataByAssetId } from '@/shared/api/assets';

export const PortfolioTransactions = observer(() => {
  const [parent] = useAutoAnimate();
  const { subaccount } = connectionStore;
  const getMetadataByAssetId = useGetMetadataByAssetId();
  const { data: transactions, isLoading } = useTransactions(subaccount);

  return (
    <div ref={parent} className='flex flex-col gap-1'>
      {isLoading && Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className='h-[72px]'>
          <Skeleton />
        </div>
      ))}

      {transactions?.map((tx, index) => (
        <TransactionSummary key={index} info={tx} getMetadataByAssetId={getMetadataByAssetId} />
      ))}
    </div>
  );
});
