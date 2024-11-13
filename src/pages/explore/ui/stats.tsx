import { Text } from '@penumbra-zone/ui/Text';
import { InfoCard } from './info-card';

export const ExploreStats = () => {
  return (
    <div className='grid grid-cols-1 desktop:grid-cols-3 gap-2'>
      <InfoCard title='Total Trading Volume (24h)'>
        <Text large color='text.primary'>
          $125.6M
        </Text>
      </InfoCard>
      <InfoCard title='Number of Trades (24h)'>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
      <InfoCard title='Largest Trading Pair (24h volume)' loading>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
      <InfoCard title='Total Liquidity Available' loading>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
      <InfoCard title='Number of Active Pairs' loading>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
      <InfoCard title='Top Price Mover (24h)' loading>
        <Text large color='text.primary'>
          12,450 trades
        </Text>
      </InfoCard>
    </div>
  );
};
