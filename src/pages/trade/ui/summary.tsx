import { ReactNode } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Text } from '@penumbra-zone/ui/Text';
import { Skeleton } from '@/shared/ui/skeleton';
import { useSummary } from '../model/useSummary';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { round } from '@penumbra-zone/types/round';
import { Density } from '@penumbra-zone/ui/Density';
import { SummaryDataResponse } from '@/shared/api/server/types.ts';

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
          {data && 'price' in data ? round({ value: data.price, decimals: 6 }) : '-'}
        </Text>
      </SummaryCard>
      <SummaryCard title='24h Change' loading={isLoading}>
        {data && 'change' in data ? (
          <Text detail color={getColor(data)}>
            {getTextSign(data)}
            {data.change.percent}%
          </Text>
        ) : (
          <Text detail color='text.primary'>
            -
          </Text>
        )}
      </SummaryCard>
      <SummaryCard title='24h High' loading={isLoading}>
        <Text detail color='text.primary'>
          {data && 'high' in data ? round({ value: data.high, decimals: 6 }) : '-'}
        </Text>
      </SummaryCard>
      <SummaryCard title='24h Low' loading={isLoading}>
        <Text detail color='text.primary'>
          {data && 'low' in data ? round({ value: data.low, decimals: 6 }) : '-'}
        </Text>
      </SummaryCard>
      <SummaryCard title='24h Volume' loading={isLoading}>
        {data && 'directVolume' in data ? (
          <Density compact>
            <ValueViewComponent
              valueView={data.directVolume}
              context='table'
              abbreviate
              hideSymbol
            />
          </Density>
        ) : (
          <Text detail color='text.primary'>
            -
          </Text>
        )}
      </SummaryCard>
    </div>
  );
};

const getTextSign = (res: SummaryDataResponse) => {
  if (res.change.sign === 'positive') {
    return '+';
  }
  if (res.change.sign === 'negative') {
    return '-';
  }
  return '';
};

const getColor = (res: SummaryDataResponse) => {
  if (res.change.sign === 'positive') {
    return 'success.light';
  }
  if (res.change.sign === 'negative') {
    return 'destructive.light';
  }
  return 'neutral.light';
};
