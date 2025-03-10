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
import { useAutoAnimate } from '@formkit/auto-animate/react';
import cn from 'clsx';

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
                <Table.Th>Asset</Table.Th>
                <Table.Th>Shielded Balance</Table.Th>
                <Table.Th>Public Balance</Table.Th>
                <Table.Th>Price</Table.Th>
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
    valueUSDC: number;
  }[] = [];

  // Add shielded balance (on Penumbra) if it exists
  if (asset.shieldedBalance) {
    locations.push({
      type: 'shielded',
      label: 'on Penumbra',
      amount: asset.shieldedBalance.amount,
      token: asset.symbol,
      action: 'Unshield',
      valueUSDC: asset.shieldedValue,
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
      valueUSDC: asset.publicValue,
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
            {/* Asset location info - spans first two columns */}
            <div className='flex items-center gap-1 text-sm text-gray-400 col-span-2'>
              <div className='ml-8'>
                {/* Display amount in token */}
                <Text color='text.primary'>
                  {location.amount} {location.token}
                </Text>
                {/* Display location label */}
                <Text small color='text.secondary'>
                  {location.label}
                </Text>
              </div>
            </div>

            {/* Action button - at the end of the first column */}
            <div className='flex justify-end'>
              {location.action && (
                <Button
                  actionType={location.action === 'Shield' ? 'accent' : 'default'}
                  disabled={false} // This would be based on actual capability in production
                >
                  {location.action}
                </Button>
              )}
            </div>

            {/* Price column - should align with main table */}
            <div className='text-right'>
              {/* In a real implementation, we would use the actual price data */}
              <Text color='text.secondary'>
                {asset.symbol === 'USDC' ? '1.00 USDC' : '6.00 USDC'}
              </Text>
            </div>

            {/* Value columns - these should align with the main table */}
            <div className='text-right'>
              {location.type === 'shielded' ? (
                <Text>{location.valueUSDC.toFixed(2)} USDC</Text>
              ) : (
                <Text color='text.secondary'>-</Text>
              )}
            </div>

            <div className='text-right'>
              {location.type === 'public' ? (
                <Text>{location.valueUSDC.toFixed(2)} USDC</Text>
              ) : (
                <Text color='text.secondary'>-</Text>
              )}
            </div>

            {/* Total value - empty for sub-rows */}
            <div></div>
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
  }: {
    asset: ReturnType<typeof useUnifiedAssets>['unifiedAssets'][0];
    isExpanded: boolean;
    toggleExpanded: () => void;
  }) => {
    const [parent] = useAutoAnimate();

    return (
      <div ref={parent}>
        <div
          className={cn(
            'cursor-pointer hover:bg-[rgba(250,250,250,0.02)]',
            isExpanded && 'bg-[rgba(250,250,250,0.02)] rounded-t-2xl',
          )}
          onClick={toggleExpanded}
        >
          <Table.Tr>
            {/* Asset info */}
            <Table.Td>
              <div className='flex items-center gap-2'>
                <AssetIcon metadata={asset.metadata} />
                <Text>{asset.symbol}</Text>
                <div className='ml-2' onClick={e => e.stopPropagation()}>
                  {isExpanded ? (
                    <Button actionType='accent' icon={ChevronUp} iconOnly onClick={toggleExpanded}>
                      Collapse
                    </Button>
                  ) : (
                    <Button
                      actionType='accent'
                      icon={ChevronDown}
                      iconOnly
                      onClick={toggleExpanded}
                    >
                      Expand
                    </Button>
                  )}
                </div>
              </div>
            </Table.Td>

            {/* Shielded balance with withdraw button */}
            <Table.Td>
              <div className='flex items-center justify-between'>
                {asset.shieldedBalance ? (
                  <ValueViewComponent valueView={asset.shieldedBalance.valueView} />
                ) : (
                  <Text color='text.secondary'>-</Text>
                )}
                {asset.canWithdraw && asset.shieldedBalance && (
                  <div onClick={e => e.stopPropagation()}>
                    <Button icon={ArrowUpRight} iconOnly disabled>
                      Withdraw
                    </Button>
                  </div>
                )}
              </div>
            </Table.Td>

            {/* Public balance with deposit button */}
            <Table.Td>
              <div className='flex items-center justify-between'>
                {asset.publicBalance ? (
                  <ValueViewComponent valueView={asset.publicBalance.valueView} />
                ) : (
                  <Text color='text.secondary'>-</Text>
                )}
                {asset.canDeposit && asset.publicBalance && (
                  <div onClick={e => e.stopPropagation()}>
                    <Button icon={ArrowDownRight} iconOnly disabled>
                      Deposit
                    </Button>
                  </div>
                )}
              </div>
            </Table.Td>

            {/* Price */}
            <Table.Td>
              <Text color='text.secondary'>-</Text>
            </Table.Td>

            {/* Total value */}
            <Table.Td>
              <Text color='text.secondary'>-</Text>
            </Table.Td>
          </Table.Tr>
        </div>

        {isExpanded && <ExpandedRowContent asset={asset} />}
      </div>
    );
  },
);

export const AssetsTable = observer(() => {
  const { unifiedAssets, isLoading, isPenumbraConnected, isCosmosConnected } = useUnifiedAssets();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [parent] = useAutoAnimate();

  const toggleRow = (symbol: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [symbol]: !prev[symbol],
    }));
  };

  if (isLoading) {
    return <LoadingState />;
  }

  // Check if any wallet is connected
  const isAnyWalletConnected = isPenumbraConnected || isCosmosConnected;
  if (!isAnyWalletConnected) {
    return <NotConnectedNotice />;
  }

  // Check if there are any assets to display
  const hasAnyAssets = unifiedAssets.length > 0;
  if (!hasAnyAssets) {
    return <NoAssetsNotice />;
  }

  return (
    <div className='m-4 sm:m-0'>
      <Card>
        <div className='sm:p-3 p-1'>
          <Text large color='text.primary'>
            Assets
          </Text>

          <Density compact>
            <div ref={parent} className='overflow-scroll sm:overflow-hidden sm:m-0 -mr-4'>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Asset</Table.Th>
                    <Table.Th>Shielded Balance</Table.Th>
                    <Table.Th>Public Balance</Table.Th>
                    <Table.Th>Price</Table.Th>
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
                    />
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          </Density>
        </div>
      </Card>
    </div>
  );
});
