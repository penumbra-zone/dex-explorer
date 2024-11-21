import { Text } from '@penumbra-zone/ui/Text';
import { InfoCard } from './info-card';
import { useStats } from '../api/use-stats';

export const ExploreStats = () => {
  const { data, isLoading, error } = useStats();
  console.log(data);

  if (error) {
    return (
      <Text large color='destructive.light'>{error.name}: {error.message}</Text>
    )
  }

  return (
    <div className='grid grid-cols-1 desktop:grid-cols-3 gap-2'>
      <InfoCard loading={isLoading} title='Total Trading Volume (24h)'>
        <Text large color='text.primary'>
          $125.6M
        </Text>
      </InfoCard>
      <InfoCard loading={isLoading} title='Number of Trades (24h)'>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
      <InfoCard loading={isLoading} title='Largest Trading Pair (24h volume)'>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
      <InfoCard loading={isLoading} title='Total Liquidity Available'>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
      <InfoCard loading={isLoading} title='Number of Active Pairs'>
        {data && (
          <Text large color='text.primary'>
            {data.active_pairs} pairs
          </Text>
        )}
      </InfoCard>
      <InfoCard loading={isLoading} title='Top Price Mover (24h)'>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
    </div>
  );
};
