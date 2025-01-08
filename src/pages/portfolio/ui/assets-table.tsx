import { Table } from '@penumbra-zone/ui/Table';
import { Card } from '@penumbra-zone/ui/Card';
import { Text } from '@penumbra-zone/ui/Text';
import { ArrowUpRight } from 'lucide-react';
import { Density } from '@penumbra-zone/ui/Density';
import { useBalances } from '@/shared/api/balances';
import { useAssets } from '@/shared/api/assets';
import { usePairs } from '@/pages/trade/api/use-pairs';
import { observer } from 'mobx-react-lite';
import { Skeleton } from '@/shared/ui/skeleton';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { connectionStore } from '@/shared/model/connection';
import {
  getMetadataFromBalancesResponse,
  getBalanceView,
} from '@penumbra-zone/getters/balances-response';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import type { PairData } from '@/shared/api/server/summary/pairs';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { formatAmount } from '@penumbra-zone/types/amount';
import { calculateDisplayPrice } from '@/shared/utils/price-conversion';
import { useRouter } from 'next/navigation';
import { Button } from '@penumbra-zone/ui/Button';

const LoadingState = () => {
  return (
    <div className='p-6'>
      <Card>
        <Text h3>Assets</Text>

        {/* Asset distribution bar skeleton */}
        <div className='w-full h-2 mt-4 mb-6'>
          <Skeleton />
        </div>

        {/* Legend skeleton */}
        <div className='flex flex-wrap gap-4 mb-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='flex items-center gap-2'>
              <div className='w-3 h-3'>
                <Skeleton />
              </div>
              <div className='w-20 h-4'>
                <Skeleton />
              </div>
            </div>
          ))}
        </div>

        <Density compact>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Asset</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <div className='flex items-center gap-2'>
                      <div className='w-8 h-8'>
                        <Skeleton />
                      </div>
                      <div className='w-20 h-4'>
                        <Skeleton />
                      </div>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='w-24 h-4'>
                      <Skeleton />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='w-24 h-4'>
                      <Skeleton />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='w-24 h-4'>
                      <Skeleton />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='flex gap-2'>
                      <div className='w-5 h-5'>
                        <Skeleton />
                      </div>
                      <div className='w-5 h-5'>
                        <Skeleton />
                      </div>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Density>
      </Card>
    </div>
  );
};

const NotConnectedNotice = () => {
  return (
    <div className='p-6'>
      <Card>
        <div className='flex flex-col items-center justify-center h-[400px] gap-4'>
          <Text color='text.secondary' small>
            Connect wallet to see your assets
          </Text>
        </div>
      </Card>
    </div>
  );
};

const calculateAssetDistribution = (balances: BalancesResponse[]) => {
  const validBalances = balances.filter(balance => {
    const valueView = getBalanceView.optional(balance);
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    return valueView && metadata;
  });

  const total = validBalances.reduce((acc, balance) => {
    const valueView = getBalanceView.optional(balance);
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    const amount = valueView?.valueView.value?.amount;
    if (!amount || !metadata) {
      return acc;
    }
    const formattedAmount = Number(
      formatAmount({
        amount,
        exponent: getDisplayDenomExponent(metadata),
      }),
    );
    return acc + formattedAmount;
  }, 0);

  if (total === 0) {
    return [];
  }

  return validBalances.map(balance => {
    const valueView = getBalanceView.optional(balance);
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    const amount = valueView?.valueView.value?.amount;
    if (!amount || !metadata) {
      return { percentage: 0, color: '#000000' };
    }
    const formattedAmount = Number(
      formatAmount({
        amount,
        exponent: getDisplayDenomExponent(metadata),
      }),
    );
    return {
      percentage: (formattedAmount / total) * 100,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color for now
    };
  });
};

export const AssetsTable = observer(() => {
  const router = useRouter();
  const { connected } = connectionStore;
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: pairs, isLoading: pairsLoading } = usePairs();

  if (!connected) {
    return <NotConnectedNotice />;
  }

  if (balancesLoading || assetsLoading || pairsLoading || !balances || !assets || !pairs) {
    return <LoadingState />;
  }

  const validBalances = balances.filter(balance => {
    const valueView = getBalanceView.optional(balance);
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    return valueView && metadata;
  });

  const distribution = calculateAssetDistribution(validBalances);

  // Find price for an asset from pairs data
  const getAssetPrice = (metadata: Metadata) => {
    const pair = pairs.find(
      (p: PairData) =>
        p.baseAsset.symbol === metadata.symbol || p.quoteAsset.symbol === metadata.symbol,
    );
    if (!pair) {
      return null;
    }

    // If the asset is the quote asset, we use the price directly
    // If it's the base asset, we need to calculate the inverse
    const isQuote = pair.quoteAsset.symbol === metadata.symbol;
    const amount = pair.volume.valueView.value?.amount;
    if (!amount) {
      return null;
    }

    const formattedAmount = formatAmount({
      amount,
      exponent: getDisplayDenomExponent(isQuote ? pair.quoteAsset : pair.baseAsset),
    });

    const price = Number(formattedAmount);
    if (isQuote) {
      return price;
    } else {
      return calculateDisplayPrice(1 / price, pair.baseAsset, pair.quoteAsset);
    }
  };

  return (
    <div className='p-6'>
      <Card>
        <Text h3>Assets</Text>

        {/* Asset distribution bar */}
        <div className='flex w-full h-2 mt-4 mb-6 rounded-full overflow-hidden'>
          {distribution.map((asset, index) => (
            <div
              key={index}
              style={{
                width: `${asset.percentage}%`,
                backgroundColor: asset.color,
              }}
              className='h-full first:rounded-l-full last:rounded-r-full'
            />
          ))}
        </div>

        {/* Legend */}
        <div className='flex flex-wrap gap-4 mb-6'>
          {validBalances.map((balance, index) => {
            const metadata = getMetadataFromBalancesResponse.optional(balance);
            if (!metadata || !distribution[index]) {
              return null;
            }
            return (
              <div key={metadata.symbol} className='flex items-center gap-2'>
                <div
                  className='w-3 h-3 rounded-full'
                  style={{ backgroundColor: distribution[index].color }}
                />
                <Text small color='text.secondary'>
                  {metadata.symbol} {distribution[index].percentage.toFixed(1)}%
                </Text>
              </div>
            );
          })}
        </div>

        <Density compact>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Asset</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {validBalances.map(balance => {
                const metadata = getMetadataFromBalancesResponse.optional(balance);
                const valueView = getBalanceView.optional(balance);
                if (!metadata || !valueView) {
                  return null;
                }

                const price = getAssetPrice(metadata);
                const amount = valueView.valueView.value?.amount;
                const formattedAmount = amount
                  ? Number(
                      formatAmount({
                        amount,
                        exponent: getDisplayDenomExponent(metadata),
                      }),
                    )
                  : null;
                const value = price && formattedAmount ? price * formattedAmount : null;

                return (
                  <Table.Tr key={metadata.symbol}>
                    <Table.Td>
                      <div className='flex items-center gap-2'>
                        <AssetIcon metadata={metadata} />
                        <Text>{metadata.symbol}</Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <ValueViewComponent valueView={valueView} />
                    </Table.Td>
                    <Table.Td>
                      {price ? (
                        <Text>${price.toFixed(2)}</Text>
                      ) : (
                        <Text color='text.secondary'>-</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {value ? (
                        <Text>${value.toFixed(2)}</Text>
                      ) : (
                        <Text color='text.secondary'>-</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <div className='flex gap-2'>
                        <Button
                          icon={ArrowUpRight}
                          actionType='accent'
                          onClick={() => router.push(`/trade/${metadata.symbol}/TestUSD`)}
                        >
                          Buy
                        </Button>
                        <Button
                          icon={ArrowUpRight}
                          actionType='destructive'
                          onClick={() => router.push(`/trade/TestUSD/${metadata.symbol}`)}
                        >
                          Sell
                        </Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Density>
      </Card>
    </div>
  );
});
