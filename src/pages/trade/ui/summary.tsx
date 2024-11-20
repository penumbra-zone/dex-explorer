import { ReactNode } from 'react';
import cn from 'clsx';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Text } from '@penumbra-zone/ui/Text';
import { Skeleton } from '@/shared/ui/skeleton';
import { useSummary } from '../model/useSummary';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { round } from '@/shared/utils/numbers/round';

const SummaryCard = ({
  title,
  loading,
  children,
}: {
  title: string;
  loading?: boolean;
  children: ReactNode;
}) => {
  const [parent] = useAutoAnimate();

  return (
    <div ref={parent} className='flex flex-col gap-[2px]'>
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
  );
};

export const Summary = () => {
  const { data, isLoading, error } = useSummary('1d');

  if (error) {
    return (
      <SummaryCard title=''>
        <Text detail color='destructive.light'>
          {String(error)}
        </Text>
      </SummaryCard>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
      <SummaryCard title='Price' loading={isLoading}>
        <Text detail color='text.primary'>
          {data && 'price' in data ? round(data.price, 6) : '-'}
        </Text>
      </SummaryCard>
      <SummaryCard title='24h Change' loading={isLoading}>
        {data && 'noData' in data && '-'}
        {data && 'change' in data && (
          <div
            className={cn(
              'flex items-center gap-1',
              // eslint-disable-next-line -- don't like this rule
              data.change.sign === 'positive'
                ? 'text-success-light'
                : data.change.sign === 'negative'
                  ? 'text-destructive-light'
                  : 'text-neutral-light',
            )}
          >
            <Text detail>{data.change.percent}</Text>
            <span
              className={cn(
                'flex h-4 px-1 rounded-full text-success-dark',
                // eslint-disable-next-line -- don't like this rule
                data.change.sign === 'positive'
                  ? 'bg-success-light'
                  : data.change.sign === 'negative'
                    ? 'bg-destructive-light'
                    : 'bg-neutral-light',
              )}
            >
              <Text detail>
                {/* eslint-disable-next-line -- don't like this rule */}
                {data.change.sign === 'positive' ? '+' : data.change.sign === 'negative' ? '-' : ''}
                {data.change.percent}%
              </Text>
            </span>
          </div>
        )}
      </SummaryCard>
      <SummaryCard title='24h High' loading={isLoading}>
        <Text detail color='text.primary'>
          {data && 'high' in data ? round(data.high, 6) : '-'}
        </Text>
      </SummaryCard>
      <SummaryCard title='24h Low' loading={isLoading}>
        <Text detail color='text.primary'>
          {data && 'low' in data ? round(data.low, 6) : '-'}
        </Text>
      </SummaryCard>
      <SummaryCard title='24h Volume' loading={isLoading}>
        {data && 'directVolume' in data ? (
          <ValueViewComponent valueView={data.directVolume} />
        ) : (
          '-'
        )}
      </SummaryCard>
    </div>
  );
};
