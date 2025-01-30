import { ReactNode } from 'react';
import { Text } from '@penumbra-zone/ui/Text';
import { Skeleton } from '@/shared/ui/skeleton';
import { BlockSummaryData } from '../api/types';
import { Card } from '@penumbra-zone/ui/Card';
import { Density } from '@penumbra-zone/ui/Density';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';

const SummaryCard = ({
  title,
  loading,
  children,
}: {
  title: string;
  loading?: boolean;
  children: ReactNode;
}) => {
  return (
    <Card>
      <Density compact>
        <div className='flex flex-col gap-[2px]'>
          {loading ? (
            <>
              <div className='h-4 w-10'>
                <Skeleton />
              </div>
              <div className='h-4 w-[4.5rem]'>
                <Skeleton />
              </div>
            </>
          ) : (
            <>
              <Text detail color='text.secondary' whitespace='nowrap'>
                {title}
              </Text>
              {children}
            </>
          )}
        </div>
      </Density>
    </Card>
  );
};

interface BlockSummaryProps {
  data?: BlockSummaryData;
  isLoading: boolean;
}

export const BlockSummary = ({ data, isLoading }: BlockSummaryProps) => {
  return (
    <div className='flex flex-col gap-4'>
      <Text xxl color='base.white'>
        Block Summary
      </Text>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <SummaryCard title='Height' loading={isLoading}>
          <Text detail color='text.primary'>
            {data?.height ?? '-'}
          </Text>
        </SummaryCard>
        <SummaryCard title='Timestamp' loading={isLoading}>
          <Text detail color='text.primary'>
            {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '-'}
          </Text>
        </SummaryCard>
        <SummaryCard title='Total Transactions' loading={isLoading}>
          <Text detail color='text.primary'>
            {data?.totalTransactions ?? '-'}
          </Text>
        </SummaryCard>
        <SummaryCard title='Total Volume' loading={isLoading}>
          {data?.totalVolume ? (
            <ValueViewComponent valueView={data.totalVolume} context='table' />
          ) : (
            <Text detail color='text.primary'>
              -
            </Text>
          )}
        </SummaryCard>
        <SummaryCard title='Total Fees' loading={isLoading}>
          {data?.totalFees ? (
            <ValueViewComponent valueView={data.totalFees} context='table' />
          ) : (
            <Text detail color='text.primary'>
              -
            </Text>
          )}
        </SummaryCard>
        <SummaryCard title='Total Batch Swaps' loading={isLoading}>
          <Text detail color='text.primary'>
            {data?.totalBatchSwaps ?? '-'}
          </Text>
        </SummaryCard>
      </div>
    </div>
  );
};
