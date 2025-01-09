import { Table } from '@penumbra-zone/ui/Table';
import { Card } from '@penumbra-zone/ui/Card';
import { Text } from '@penumbra-zone/ui/Text';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Density } from '@penumbra-zone/ui/Density';
import { useBalances } from '@/shared/api/balances';
import { useAssets } from '@/shared/api/assets';
import { observer } from 'mobx-react-lite';
import { Skeleton } from '@/shared/ui/skeleton';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { connectionStore } from '@/shared/model/connection';
import {
  getMetadataFromBalancesResponse,
  getBalanceView,
} from '@penumbra-zone/getters/balances-response';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { formatAmount } from '@penumbra-zone/types/amount';
import { useRouter } from 'next/navigation';
import { Button } from '@penumbra-zone/ui/Button';

const LoadingState = () => {
  return (
    <div className='p-6'>
      <Card>
        <Text color='text.primary'>Assets</Text>

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

  // Calculate values first
  const valuesWithMetadata = validBalances.map(balance => {
    const valueView = getBalanceView.optional(balance);
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    const amount = valueView?.valueView.value?.amount;
    if (!amount || !metadata) {
      return { value: 0, balance };
    }
    const formattedAmount = Number(
      formatAmount({
        amount,
        exponent: getDisplayDenomExponent(metadata),
      }),
    );

    return {
      value: formattedAmount,
      balance,
    };
  });

  const totalValue = valuesWithMetadata.reduce((acc, { value }) => acc + value, 0);

  if (totalValue === 0) {
    return { distribution: [], sortedBalances: [] };
  }

  const distributionWithMetadata = valuesWithMetadata.map(({ value, balance }) => ({
    percentage: (value / totalValue) * 100,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    balance,
  }));

  // Sort by value percentage in descending order
  const sorted = distributionWithMetadata.sort((a, b) => b.percentage - a.percentage);

  return {
    distribution: sorted.map(({ percentage, color }) => ({ percentage, color })),
    sortedBalances: sorted.map(({ balance }) => balance),
  };
};

export const AssetsTable = observer(() => {
  const router = useRouter();
  const { connected } = connectionStore;
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const { data: assets, isLoading: assetsLoading } = useAssets();

  // Determine if we're on testnet (anything that's not penumbra-1 is testnet)
  const isTestnet = process.env['PENUMBRA_CHAIN_ID'] !== 'penumbra-1';
  const stableCoinSymbol = isTestnet ? 'UM' : 'USDC';

  if (!connected) {
    return <NotConnectedNotice />;
  }

  if (balancesLoading || assetsLoading || !balances || !assets) {
    return <LoadingState />;
  }

  const validBalances = balances.filter(balance => {
    const valueView = getBalanceView.optional(balance);
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    return valueView && metadata;
  });

  const { distribution, sortedBalances } = calculateAssetDistribution(validBalances);

  return (
    <Card>
      <div className='p-3'>
        <Text large color='text.primary'>
          Assets
        </Text>

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
          {sortedBalances.map((balance, index) => {
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
                <Table.Th hAlign='right'>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedBalances.map(balance => {
                const metadata = getMetadataFromBalancesResponse.optional(balance);
                const valueView = getBalanceView.optional(balance);
                if (!metadata || !valueView) {
                  return null;
                }

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
                      <Text color='text.secondary'>-</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text color='text.secondary'>-</Text>
                    </Table.Td>
                    <Table.Td hAlign='right'>
                      <div className='flex gap-2 justify-end'>
                        <Button
                          icon={ArrowDownRight}
                          iconOnly
                          onClick={() =>
                            router.push(`/trade/${stableCoinSymbol}/${metadata.symbol}`)
                          }
                        >
                          Sell
                        </Button>
                        <Button
                          icon={ArrowUpRight}
                          iconOnly
                          onClick={() =>
                            router.push(`/trade/${metadata.symbol}/${stableCoinSymbol}`)
                          }
                        >
                          Buy
                        </Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Density>
      </div>
    </Card>
  );
});
