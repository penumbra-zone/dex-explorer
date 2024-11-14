import { ReactNode } from 'react';
import cn from 'clsx';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Text } from '@penumbra-zone/ui/Text';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Skeleton } from '@/shared/ui/skeleton';
import { useSummary } from '../model/useSummary';
import { usePathToMetadata } from '../model/use-path';
import { shortify } from '@/shared/utils/numbers/shortify';
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
  const { data, isLoading, error } = useSummary();
  const { quoteAsset } = usePathToMetadata();

  const change24h = data && {
    positive: data.current_price >= data.price_24h_ago,
    change: round(data.current_price - data.price_24h_ago, 4),
    percent: round(
      Math.abs(((data.current_price - data.price_24h_ago) / data.price_24h_ago) * 100),
      2,
    ),
  };

  if (error) {
    return (
      <SummaryCard title='Error'>
        <Text detail color='destructive.light'>
          Error: {String(error)}
        </Text>
      </SummaryCard>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
      <SummaryCard title='Price' loading={isLoading}>
        {data && (
          <Text detail color='text.primary'>
            {round(data.current_price, 6)}
          </Text>
        )}
      </SummaryCard>
      <SummaryCard title='24h Change' loading={isLoading}>
        {change24h && (
          <div
            className={cn(
              'flex items-center gap-1',
              change24h.positive ? 'text-success-light' : 'text-destructive-light',
            )}
          >
            <Text detail>{change24h.change}</Text>
            <span className='flex h-4 px-1 bg-success-light rounded-full text-success-dark'>
              <Text detail>
                {change24h.positive ? '+' : '-'}
                {change24h.percent}%
              </Text>
            </span>
          </div>
        )}
      </SummaryCard>
      <SummaryCard title='24h High' loading={isLoading}>
        {data && (
          <Text detail color='text.primary'>
            {round(data.high_24h, 4)}
          </Text>
        )}
      </SummaryCard>
      <SummaryCard title='24h Low' loading={isLoading}>
        {data && (
          <Text detail color='text.primary'>
            {round(data.low_24h, 4)}
          </Text>
        )}
      </SummaryCard>
      <SummaryCard title='24h Volume' loading={isLoading}>
        {data && (
          <div className='flex items-center gap-1'>
            {quoteAsset && <AssetIcon metadata={quoteAsset} size='sm' />}
            <Text detail color='text.primary'>
              {shortify(data.direct_volume_24h)}
            </Text>
          </div>
        )}
      </SummaryCard>
    </div>
  );
};
