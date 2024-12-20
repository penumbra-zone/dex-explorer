'use client';

import { LoadingCell } from './market-trades';
import { connectionStore } from '@/shared/model/connection';
import { observer } from 'mobx-react-lite';
import { Text, TextProps } from '@penumbra-zone/ui/Text';
import { Table } from '@penumbra-zone/ui/Table';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { Density } from '@penumbra-zone/ui/Density';
import { TooltipProvider } from '@penumbra-zone/ui/Tooltip';
import { Tooltip } from '@penumbra-zone/ui/Tooltip';
import { Order, stateToString, usePositions } from '@/pages/trade/api/positions.ts';
import {
  PositionId,
  PositionState_PositionStateEnum,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { Button } from '@penumbra-zone/ui/Button';
import { positionsStore } from '@/pages/trade/model/positions';
import Link from 'next/link';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useEffect } from 'react';
import { pnum } from '@penumbra-zone/types/pnum';
import { useRegistryAssets } from '@/shared/api/registry';
import { usePathToMetadata } from '../model/use-path';
import { PositionsCurrentValue } from './positions-current-value';

const NotConnectedNotice = () => {
  return (
    <div className='p-5'>
      <Text small color='text.secondary'>
        Connect your wallet
      </Text>
    </div>
  );
};

const NoPositions = () => {
  return (
    <div className='p-5'>
      <Text small color='text.secondary'>
        No liquidity positions opened
      </Text>
    </div>
  );
};

const ErrorNotice = ({ error }: { error: unknown }) => {
  return (
    <div className='p-5'>
      <Text small color='destructive.light'>
        {String(error)}
      </Text>
    </div>
  );
};

const getStateLabel = (
  state: PositionState_PositionStateEnum,
  side?: Order['side'],
): { label: string; color: TextProps['color'] } => {
  if (side && state === PositionState_PositionStateEnum.OPENED) {
    if (side === 'Buy') {
      return { label: side, color: 'success.light' };
    } else {
      return { label: side, color: 'destructive.light' };
    }
  } else {
    return { label: stateToString(state), color: 'neutral.light' };
  }
};

const ActionButton = observer(
  ({ state, id }: { state: PositionState_PositionStateEnum; id: PositionId }) => {
    const { loading, closePositions, withdrawPositions } = positionsStore;

    if (state === PositionState_PositionStateEnum.OPENED) {
      return (
        <Button density='slim' onClick={() => void closePositions([id])} disabled={loading}>
          Close
        </Button>
      );
    } else if (state === PositionState_PositionStateEnum.CLOSED) {
      return (
        <Button density='slim' disabled={loading} onClick={() => void withdrawPositions([id])}>
          Withdraw
        </Button>
      );
    } else {
      return (
        <Text detail color='text.secondary'>
          -
        </Text>
      );
    }
  },
);

const RowLabel = ({
  state,
  direction,
}: {
  state: PositionState_PositionStateEnum;
  direction: Order['side'];
}) => {
  const { label, color } = getStateLabel(state, direction);
  return (
    <Text detail color={color}>
      {label}
    </Text>
  );
  // A withdrawn position has no orders
  // if (!p.orders.length) {
  //   const { label, color } = getStateLabel(p.positionState);
  //   return (
  //     <Text detail color={color}>
  //       {label}
  //     </Text>
  //   );
  // }
  // // For opened or closed positions
  // return p.orders.map((o, i) => {
  //   const { label, color } = getStateLabel(p.positionState, o.side);
  //   return (
  //     <Text detail color={color} key={i}>
  //       {label}
  //     </Text>
  //   );
  // });
};

const MAX_ACTION_COUNT = 15;

const HeaderActionButton = observer(({ displayPositions }: { displayPositions: Position[] }) => {
  const { loading, closePositions, withdrawPositions } = positionsStore;

  const openedPositions =
    displayPositions.filter(p => p.state === PositionState_PositionStateEnum.OPENED) ?? [];
  if (openedPositions.length > 1) {
    return (
      <Button
        density='slim'
        actionType='destructive'
        disabled={loading}
        onClick={() =>
          void closePositions(openedPositions.slice(0, MAX_ACTION_COUNT).map(p => p.positionId))
        }
      >
        Close Batch
      </Button>
    );
  }

  const closedPositions =
    displayPositions.filter(p => p.state === PositionState_PositionStateEnum.CLOSED) ?? [];
  if (closedPositions.length > 1) {
    return (
      <Button
        density='slim'
        actionType='destructive'
        disabled={loading}
        onClick={() =>
          void withdrawPositions(closedPositions.map(p => p.positionId).slice(0, MAX_ACTION_COUNT))
        }
      >
        Withdraw Batch
      </Button>
    );
  }

  return 'Actions';
});

const Positions = observer(({ showInactive }: { showInactive: boolean }) => {
  const { connected } = connectionStore;
  const { baseAsset, quoteAsset } = usePathToMetadata();
  const { data: assets } = useRegistryAssets();
  const { data, isLoading, error } = usePositions();
  const { displayPositions, setPositions, setAssets } = positionsStore;
  console.log('TCL: displayPositions', displayPositions);

  useEffect(() => {
    setPositions(data ?? {});
  }, [data, setPositions]);

  useEffect(() => {
    setAssets(assets ?? []);
  }, [assets, setAssets]);

  useEffect(() => {
    if (baseAsset && quoteAsset) {
      positionsStore.setCurrentPair(baseAsset, quoteAsset);
    }
  }, [baseAsset, quoteAsset]);

  if (!connected) {
    return <NotConnectedNotice />;
  }

  if (error) {
    return <ErrorNotice error={error} />;
  }

  if (!displayPositions.length) {
    return <NoPositions />;
  }

  return (
    <TooltipProvider>
      <Density variant='slim'>
        <div className='flex justify-center px-4'>
          <Table bgColor='base.blackAlt'>
            <Table.Thead>
              <Table.Tr>
                <Table.Th density='slim'>
                  <Text tableHeadingSmall>Type</Text>
                </Table.Th>
                <Table.Th density='slim'>
                  <Text tableHeadingSmall>Trade Amount</Text>
                </Table.Th>
                <Table.Th density='slim'>
                  <Text tableHeadingSmall>Effective Price</Text>
                </Table.Th>
                <Table.Th density='slim'>
                  <Text tableHeadingSmall>Fee Tier</Text>
                </Table.Th>
                <Table.Th density='slim'>
                  <Text tableHeadingSmall>Base Price</Text>
                </Table.Th>
                <Table.Th density='slim'>
                  <Text tableHeadingSmall>Current Value</Text>
                </Table.Th>
                <Table.Th density='slim'>
                  <Text tableHeadingSmall>Position ID</Text>
                </Table.Th>
                <Table.Th hAlign='right' density='slim'>
                  <HeaderActionButton displayPositions={displayPositions} />
                  {/* <Text tableHeadingSmall>Actions</Text> */}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading &&
                Array.from({ length: 15 }).map((_, i) => (
                  <Table.Tr key={i}>
                    {Array.from({ length: 8 }).map((_, index) => (
                      <Table.Td key={index}>
                        <LoadingCell key={index} />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              {displayPositions
                .filter(p => (showInactive ? true : p.isActive))
                .map(p => {
                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td density='slim'>
                        <RowLabel state={p.state} direction={p.direction} />
                      </Table.Td>
                      <Table.Td density='slim'>
                        <ValueViewComponent
                          valueView={p.amount}
                          trailingZeros={true}
                          density='slim'
                        />
                      </Table.Td>
                      <Table.Td density='slim'>
                        <Tooltip
                          message={
                            <div>
                              <div>
                                <Text detail color='text.primary'>
                                  Base price: {pnum(p.basePrice).toFormattedString()}
                                </Text>
                              </div>
                              <div>
                                <Text detail color='text.primary'>
                                  Fee:{' '}
                                  {pnum(p.basePrice)
                                    .toBigNumber()
                                    .minus(pnum(p.effectivePrice).toBigNumber())
                                    .toString()}{' '}
                                  ({p.fee})
                                </Text>
                              </div>
                              <div>
                                <Text detail color='text.primary'>
                                  Effective price: {pnum(p.effectivePrice).toFormattedString()}
                                </Text>
                              </div>
                            </div>
                          }
                        >
                          <ValueViewComponent
                            valueView={p.effectivePrice}
                            trailingZeros={true}
                            density='slim'
                          />
                        </Tooltip>
                      </Table.Td>
                      <Table.Td density='slim'>
                        <Text detailTechnical color='text.primary'>
                          {p.fee}
                        </Text>
                      </Table.Td>
                      <Table.Td density='slim'>
                        <ValueViewComponent
                          valueView={p.basePrice}
                          trailingZeros={true}
                          showIcon={false}
                          density='slim'
                        />
                      </Table.Td>
                      <Table.Td density='slim'>
                        <PositionsCurrentValue baseAsset={p.baseAsset} quoteAsset={p.quoteAsset} />
                      </Table.Td>
                      <Table.Td density='slim'>
                        <div className='flex max-w-[104px]'>
                          <Text as='div' detailTechnical color='text.primary' truncate>
                            {p.id}
                          </Text>
                          <Link href={`/inspect/lp/${p.id}`}>
                            <SquareArrowOutUpRight className='w-4 h-4 text-text-secondary' />
                          </Link>
                        </div>
                      </Table.Td>
                      <Table.Td hAlign='right' density='slim'>
                        <ActionButton state={p.state} id={p.positionId} />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
            </Table.Tbody>
          </Table>
        </div>
      </Density>
    </TooltipProvider>
  );
});

export default Positions;
