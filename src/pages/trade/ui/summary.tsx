import { ReactNode } from 'react';
import cn from 'clsx';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Text } from '@penumbra-zone/ui/Text';
import { Skeleton } from '@/shared/ui/skeleton';
import { useSummary } from '../model/useSummary';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { round } from '@penumbra-zone/types/round';
import { Density } from '@penumbra-zone/ui/Density';
import { SummaryDataResponse } from '@/shared/api/server/types.ts';
import { removeTrailingZeros } from '@penumbra-zone/types/shortify';

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
          {data && 'price' in data ? roundTrim(data.price) : '-'}
        </Text>
      </SummaryCard>
      <SummaryCard title='24h Change' loading={isLoading}>
        {data && 'noData' in data && (
          <Text detail color='text.primary'>
            -
          </Text>
        )}
        {data && 'change' in data && (
          <div className={cn('flex items-center gap-1', getColor(data, 'text'))}>
            <Text detail>{roundTrim(data.change.value)}</Text>
            <span
              className={cn('flex h-4 px-1 rounded-full text-success-dark', getColor(data, 'bg'))}
            >
              <Text detail>
                {getTextSign(data)}
                {data.change.percent}%
              </Text>
            </span>
          </div>
        )}
      </SummaryCard>
      <SummaryCard title='24h High' loading={isLoading}>
        <Text detail color='text.primary'>
          {data && 'high' in data ? roundTrim(data.high) : '-'}
        </Text>
      </SummaryCard>
      <SummaryCard title='24h Low' loading={isLoading}>
        <Text detail color='text.primary'>
          {data && 'low' in data ? roundTrim(data.low) : '-'}
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

// TODO: When rounding trim updated shipped in @penumbra-zone/types,
//  can remove the removeTrailingZeros() wrapper
const roundTrim = (value: number) => {
  return removeTrailingZeros(round({ value, decimals: 6 }));
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

const getColor = (res: SummaryDataResponse, version: 'text' | 'bg') => {
  if (res.change.sign === 'positive') {
    return `${version}-success-light`;
  }
  if (res.change.sign === 'negative') {
    return `${version}-destructive-light`;
  }
  return `${version}-neutral-light`;
};
