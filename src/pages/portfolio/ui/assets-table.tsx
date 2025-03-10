import { Table } from '@penumbra-zone/ui/Table';
import { Card } from '@penumbra-zone/ui/Card';
import { Text } from '@penumbra-zone/ui/Text';
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Density } from '@penumbra-zone/ui/Density';
import { Skeleton } from '@/shared/ui/skeleton';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Button } from '@penumbra-zone/ui/Button';
import { observer } from 'mobx-react-lite';
import { useUnifiedAssets } from '../hooks/use-unified-assets';
import { useState } from 'react';
import { useAssetPrices } from '../hooks/use-asset-prices';

const LoadingState = () => {
  return (
    <Card>
      <div className='p-3'>
        <Text as={'h4'} large color='text.primary'>
          Assets
        </Text>

        <Density compact>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Shielded Balance</Table.Th>
                <Table.Th>Public Balance</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Shielded Value</Table.Th>
                <Table.Th>Public Value</Table.Th>
                <Table.Th>Total Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <div className='flex items-center gap-2'>
                      <div className='w-6 h-6 rounded-full overflow-hidden'>
                        <Skeleton />
                      </div>
                      <div className='w-20 h-5'>
                        <Skeleton />
                      </div>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='w-24 h-5'>
                      <Skeleton />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='w-24 h-5'>
                      <Skeleton />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='w-24 h-5'>
                      <Skeleton />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='w-24 h-5'>
                      <Skeleton />
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className='w-24 h-5'>
                      <Skeleton />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Density>
      </div>
    </Card>
  );
};

const NotConnectedNotice = () => {
  return (
    <div className='m-4 sm:m-0'>
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

const NoAssetsNotice = () => {
  return (
    <div className='m-4 sm:m-0'>
      <Card>
        <div className='flex flex-col items-center justify-center h-[400px] gap-4'>
          <Text color='text.secondary' small>
            No assets found in your connected wallets
          </Text>
        </div>
      </Card>
    </div>
  );
};

// Define expanded row component
const ExpandedRowContent = ({
  asset,
}: {
  asset: ReturnType<typeof useUnifiedAssets>['unifiedAssets'][0];
}) => {
  // Start with locations we have actual data for
  const locations: {
    type: string;
    label: string;
    amount: string | undefined;
    token: string;
    action?: string;
    shieldedValue: number;
    publicValue: number;
    totalValue: number;
  }[] = [];

  // Add shielded balance (on Penumbra) if it exists
  if (asset.shieldedBalance) {
    locations.push({
      type: 'shielded',
      label: 'on Penumbra',
      amount: asset.shieldedBalance.amount,
      token: asset.symbol,
      action: 'Unshield',
      shieldedValue: asset.shieldedValue,
      publicValue: 0,
      totalValue: asset.shieldedValue,
    });
  }

  // Add public balance if it exists
  if (asset.publicBalance) {
    locations.push({
      type: 'public',
      label: `on ${asset.publicBalance.chain}`,
      amount: asset.publicBalance.amount,
      token: asset.symbol,
      action: 'Shield',
      shieldedValue: 0,
      publicValue: asset.publicValue,
      totalValue: asset.publicValue,
    });
  }

  return (
    <div className='bg-[rgba(20,20,20,0.6)] backdrop-blur-md rounded-b-xl'>
      {locations.length > 0 ? (
        locations.map((location, index) => (
          <div
            key={`${location.type}-${index}`}
            className='grid grid-cols-6 py-3 px-4 border-t border-gray-800 first:border-t-0'
          >
            {/* Shielded balance */}
            <div className='text-right'>
              {location.type === 'shielded' ? (
                <div className='flex items-center gap-1'>
                  <div className='ml-8'>
                    <Text color='text.primary'>
                      {location.amount} {location.token}
                    </Text>
                    <Text small color='text.secondary'>
                      {location.label}
                    </Text>
                  </div>
                </div>
              ) : (
                <Text color='text.secondary'>-</Text>
              )}
            </div>

            {/* Public balance */}
            <div className='text-right'>
              {location.type === 'public' ? (
                <div className='flex items-center gap-1'>
                  <div className='ml-8'>
                    <Text color='text.primary'>
                      {location.amount} {location.token}
                    </Text>
                    <Text small color='text.secondary'>
                      {location.label}
                    </Text>
                  </div>
                </div>
              ) : (
                <Text color='text.secondary'>-</Text>
              )}
            </div>

            {/* Price - same for all instances of an asset */}
            <div className='text-right'>
              {asset.totalValue > 0 && asset.shieldedBalance ? (
                <Text>
                  {(asset.totalValue / parseFloat(asset.shieldedBalance.amount || '1')).toFixed(2)}{' '}
                  USDC
                </Text>
              ) : (
                <Text color='text.secondary'>-</Text>
              )}
            </div>

            {/* Shielded Value */}
            <div className='text-right'>
              {location.shieldedValue > 0 ? (
                <Text>{location.shieldedValue.toFixed(2)} USDC</Text>
              ) : (
                <Text color='text.secondary'>-</Text>
              )}
            </div>

            {/* Public Value */}
            <div className='text-right'>
              {location.publicValue > 0 ? (
                <Text>{location.publicValue.toFixed(2)} USDC</Text>
              ) : (
                <Text color='text.secondary'>-</Text>
              )}
            </div>

            {/* Total value */}
            <div className='text-right flex items-center justify-between'>
              {location.totalValue > 0 ? (
                <Text>{location.totalValue.toFixed(2)} USDC</Text>
              ) : (
                <Text color='text.secondary'>-</Text>
              )}

              {/* Action button */}
              {location.action && (
                <Button
                  actionType={location.action === 'Shield' ? 'accent' : 'default'}
                  disabled={false} // This would be based on actual capability in production
                >
                  {location.action}
                </Button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className='py-4 px-6 text-center'>
          <Text color='text.secondary'>
            No detailed location information available for this asset
          </Text>
        </div>
      )}
    </div>
  );
};

// Row component with expandable functionality
const AssetRow = observer(
  ({
    asset,
    isExpanded,
    toggleExpanded,
    price,
    isCosmosConnected,
  }: {
    asset: ReturnType<typeof useUnifiedAssets>['unifiedAssets'][0];
    isExpanded: boolean;
    toggleExpanded: () => void;
    price?: { price: number; quoteSymbol: string };
    isCosmosConnected: boolean;
  }) => {
    // Remove unused variables that cause linter errors
    return (
      <>
        <Table.Tr>
          {/* Shielded balance with asset icon, name and withdraw button */}
          <Table.Td>
            <div className='flex items-center justify-between'>
              <div
                className='flex items-center gap-2 cursor-pointer'
                onClick={() => toggleExpanded()}
              >
                <AssetIcon metadata={asset.metadata} />
                {asset.shieldedBalance ? (
                  <div className='flex flex-col'>
                    <Text>
                      {asset.shieldedBalance.amount} {asset.symbol}
                    </Text>
                    {isExpanded && (
                      <Text small color='text.secondary'>
                        on Penumbra
                      </Text>
                    )}
                  </div>
                ) : (
                  <Text>{asset.symbol}</Text>
                )}
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {asset.canWithdraw && asset.shieldedBalance && (
                <div onClick={e => e.stopPropagation()}>
                  <Button icon={ArrowUpRight} iconOnly>
                    Unshield
                  </Button>
                </div>
              )}
            </div>
          </Table.Td>

          {/* Public balance with deposit button */}
          <Table.Td>
            {isCosmosConnected ? (
              <div className='flex items-center justify-between'>
                {asset.publicBalance ? (
                  <>
                    <ValueViewComponent
                      valueView={asset.publicBalance.valueView}
                      trailingZeros={false}
                      priority='tertiary'
                    />
                    {asset.canDeposit && (
                      <div onClick={e => e.stopPropagation()}>
                        <Button icon={ArrowDownRight} iconOnly>
                          Shield
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <Text color='text.secondary'>-</Text>
                )}
              </div>
            ) : (
              <Text color='text.secondary'>Cosmos wallet not connected</Text>
            )}
          </Table.Td>

          {/* Price information */}
          <Table.Td>
            {price ? (
              <div className='flex flex-col'>
                <Text color='text.primary'>
                  {price.price < 0.01
                    ? price.price.toFixed(6)
                    : price.price < 1
                      ? price.price.toFixed(4)
                      : price.price < 1000
                        ? price.price.toFixed(2)
                        : price.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                  USDC
                </Text>
              </div>
            ) : (
              <Text color='text.secondary'>-</Text>
            )}
          </Table.Td>

          {/* Shielded Value */}
          <Table.Td>
            {asset.shieldedValue > 0 ? (
              <Text>
                {asset.shieldedValue < 0.01
                  ? asset.shieldedValue.toFixed(6)
                  : asset.shieldedValue < 1
                    ? asset.shieldedValue.toFixed(4)
                    : asset.shieldedValue < 1000
                      ? asset.shieldedValue.toFixed(2)
                      : asset.shieldedValue.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{' '}
                USDC
              </Text>
            ) : (
              <Text color='text.secondary'>-</Text>
            )}
          </Table.Td>

          {/* Public Value */}
          <Table.Td>
            {asset.publicValue > 0 ? (
              <Text>
                {asset.publicValue < 0.01
                  ? asset.publicValue.toFixed(6)
                  : asset.publicValue < 1
                    ? asset.publicValue.toFixed(4)
                    : asset.publicValue < 1000
                      ? asset.publicValue.toFixed(2)
                      : asset.publicValue.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{' '}
                USDC
              </Text>
            ) : (
              <Text color='text.secondary'>-</Text>
            )}
          </Table.Td>

          {/* Total value */}
          <Table.Td>
            {asset.totalValue > 0 ? (
              <Text>
                {asset.totalValue < 0.01
                  ? asset.totalValue.toFixed(6)
                  : asset.totalValue < 1
                    ? asset.totalValue.toFixed(4)
                    : asset.totalValue < 1000
                      ? asset.totalValue.toFixed(2)
                      : asset.totalValue.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{' '}
                USDC
              </Text>
            ) : (
              <Text color='text.secondary'>-</Text>
            )}
          </Table.Td>
        </Table.Tr>

        {/* Expanded row content outside the table structure */}
        {isExpanded && (
          <Table.Tr>
            <Table.Td colSpan={6}>
              <div className='p-0 expanded-content'>
                <ExpandedRowContent asset={asset} />
              </div>
            </Table.Td>
          </Table.Tr>
        )}
      </>
    );
  },
);

export const AssetsTable = observer(() => {
  const { unifiedAssets, isLoading, isPenumbraConnected, isCosmosConnected } = useUnifiedAssets();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Get price data for all assets - adding only the prices object, not the loading state
  const { prices } = useAssetPrices(unifiedAssets.map(asset => asset.metadata));

  const toggleRow = (symbol: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [symbol]: !prev[symbol],
    }));
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isPenumbraConnected && !isCosmosConnected) {
    return <NotConnectedNotice />;
  }

  if (unifiedAssets.length === 0) {
    return <NoAssetsNotice />;
  }

  return (
    <Card>
      <div className='p-3'>
        <Text as={'h4'} large color='text.primary'>
          Assets
        </Text>

        <Density compact>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Shielded Balance</Table.Th>
                <Table.Th>Public Balance</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Shielded Value</Table.Th>
                <Table.Th>Public Value</Table.Th>
                <Table.Th>Total Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {unifiedAssets.map(asset => (
                <AssetRow
                  key={asset.symbol}
                  asset={asset}
                  isExpanded={!!expandedRows[asset.symbol]}
                  toggleExpanded={() => toggleRow(asset.symbol)}
                  price={prices[asset.symbol]}
                  isCosmosConnected={isCosmosConnected}
                />
              ))}
            </Table.Tbody>
          </Table>
        </Density>
      </div>
    </Card>
  );
});
