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
import { AssetIcon } from '@penumbra-zone/ui/AssetIcon';
import { Button } from '@penumbra-zone/ui/Button';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';

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
                    <div className='flex gap-2'>
                      <div className='w-8 h-8 rounded-full overflow-hidden'>
                        <Skeleton />
                      </div>
                      <div className='w-8 h-8 rounded-full overflow-hidden'>
                        <Skeleton />
                      </div>
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

export const AssetsTable = observer(() => {
  const { connected } = connectionStore;
  const addressIndex = new AddressIndex({ account: connectionStore.subaccount });
  const { data: balances, isLoading: balancesLoading } = useBalances(addressIndex.account);
  const { data: assets, isLoading: assetsLoading } = useAssets();

  const isLoading = balancesLoading || assetsLoading || !balances || !assets;

  if (isLoading) {
    return <LoadingState />;
  }
  if (!connected) {
    return <NotConnectedNotice />;
  }

  // Filter out NFTs and special assets
  const displayableBalances = balances.filter(balance => {
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    // If we don't have a symbol, we can't display it
    if (!metadata?.symbol) {
      return false;
    }

    // Filter out LP NFTs, unbonding tokens, and auction tokens
    return (
      !metadata.symbol.startsWith('lpNft') &&
      !metadata.symbol.startsWith('unbond') &&
      !metadata.symbol.startsWith('auction')
    );
  });

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
                    <Table.Th>Balance</Table.Th>
                    {/* TODO: Price and value are currently stubbed to -, pending pricing api in pindexer. */}
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Value</Table.Th>
                    <Table.Th hAlign='right'>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {displayableBalances.map(balance => {
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
                            <Button icon={ArrowDownRight} iconOnly disabled>
                              Sell
                            </Button>
                            <Button icon={ArrowUpRight} iconOnly disabled>
                              Buy
                            </Button>
                          </div>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          </Density>
        </div>
      </Card>
    </div>
  );
});
