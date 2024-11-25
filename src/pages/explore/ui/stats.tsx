import { round } from '@penumbra-zone/types/round';
import { Text } from '@penumbra-zone/ui/Text';
import { InfoCard } from './info-card';
import { useStats } from '../api/use-stats';
import { pluralizeAndShortify } from '@/shared/utils/pluralize';
import { shortify } from '@penumbra-zone/types/shortify';
import { getFormattedAmtFromValueView } from '@penumbra-zone/types/value-view';

export const ExploreStats = () => {
  const { data, isLoading, error } = useStats();

  if (error) {
    return (
      <Text large color='destructive.light'>
        {error.name}: {error.message}
      </Text>
    );
  }

  return (
    <div className='grid grid-cols-1 desktop:grid-cols-3 gap-2'>
      <InfoCard loading={isLoading} title='Total Trading Volume (24h)'>
        <Text large color='text.primary'>
          {data && (
            <Text large color='text.primary'>
              {shortify(Number(getFormattedAmtFromValueView(data.directVolume)))}
            </Text>
          )}
        </Text>
      </InfoCard>
      <InfoCard loading={isLoading} title='Number of Trades (24h)'>
        {data && (
          <Text large color='text.primary'>
            {pluralizeAndShortify(data.trades, 'trade', 'trades')}
          </Text>
        )}
      </InfoCard>
      <InfoCard loading={isLoading} title='Largest Trading Pair (24h volume)'>
        {data?.largestPair ? (
          <>
            <Text large color='text.primary'>
              {data.largestPair.start}/{data.largestPair.end}
            </Text>
            {data.largestPairLiquidity && (
              <Text large color='success.light'>
                {shortify(Number(getFormattedAmtFromValueView(data.largestPairLiquidity)))}
              </Text>
            )}
          </>
        ) : (
          <Text large color='text.primary'>
            -
          </Text>
        )}
      </InfoCard>
      <InfoCard loading={isLoading} title='Total Liquidity Available'>
        {data && (
          <Text large color='text.primary'>
            {shortify(Number(getFormattedAmtFromValueView(data.liquidity)))}
          </Text>
        )}
      </InfoCard>
      <InfoCard loading={isLoading} title='Number of Active Pairs'>
        {data && (
          <Text large color='text.primary'>
            {pluralizeAndShortify(data.activePairs, 'pair', 'pairs')}
          </Text>
        )}
      </InfoCard>
      <InfoCard loading={isLoading} title='Top Price Mover (24h)'>
        {data?.topPriceMover ? (
          <>
            <Text large color='text.primary'>
              {data.topPriceMover.start}/{data.topPriceMover.end}
            </Text>
            <Text large color={data.topPriceMover.percent ? 'success.light' : 'destructive.light'}>
              {data.topPriceMover.percent && '+'}
              {round({ value: data.topPriceMover.percent, decimals: 1 })}%
            </Text>
          </>
        ) : (
          <Text large color='text.primary'>
            -
          </Text>
        )}
      </InfoCard>
    </div>
  );
};
