import { Table } from '@penumbra-zone/ui/Table';
import { Card } from '@penumbra-zone/ui/Card';
import { Text } from '@penumbra-zone/ui/Text';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Density } from '@penumbra-zone/ui/Density';
import { Skeleton } from '@/shared/ui/skeleton';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Button } from '@penumbra-zone/ui/Button';
import { observer } from 'mobx-react-lite';
import { useUnifiedAssets } from '../hooks/use-unified-assets';

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

export const AssetsTable = observer(() => {
  const { unifiedAssets, isLoading, isPenumbraConnected, isCosmosConnected } = useUnifiedAssets();

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
            <div className='overflow-scroll sm:overflow-hidden sm:m-0 -mr-4'>
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
                    <Table.Tr key={asset.symbol}>
                      {/* Asset info */}
                      <Table.Td>
                        <div className='flex items-center gap-2'>
                          <AssetIcon metadata={asset.metadata} />
                          <Text>{asset.symbol}</Text>
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
                            <Button icon={ArrowUpRight} iconOnly disabled>
                              Withdraw
                            </Button>
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
                            <Button icon={ArrowDownRight} iconOnly disabled>
                              Deposit
                            </Button>
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
