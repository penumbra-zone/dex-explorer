'use client';

import cn from 'clsx';
import Link from 'next/link';
import orderBy from 'lodash/orderBy';
import { SquareArrowOutUpRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo, Fragment, ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { Text } from '@penumbra-zone/ui/Text';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { Density } from '@penumbra-zone/ui/Density';
import { Tooltip } from '@penumbra-zone/ui/Tooltip';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import { pnum } from '@penumbra-zone/types/pnum';
import { connectionStore } from '@/shared/model/connection';
import { useAssets } from '@/shared/api/assets';
import { stateToString, usePositions } from '../../api/positions.ts';
import { DisplayPosition, positionsStore } from '../../model/positions';
import { usePathToMetadata } from '../../model/use-path';
import { PositionsCurrentValue } from './positions-current-value';
import { NotConnectedNotice } from './not-connected-notice';
import { ErrorNotice } from './error-notice';
import { NoPositions } from './no-positions';
import { HeaderActionButton } from './header-action-button';
import { ActionButton } from './action-button';
import { Dash } from './dash';

const Positions = observer(({ showInactive }: { showInactive: boolean }) => {
  const { connected, subaccount } = connectionStore;
  const { baseAsset, quoteAsset } = usePathToMetadata();
  const { data: assets } = useAssets();
  const { data, isLoading, error } = usePositions(subaccount);
  const { displayPositions, setPositions, setAssets } = positionsStore;
  const [sortBy, setSortBy] = useState<{
    key: string;
    direction: 'desc' | 'asc';
  }>({
    key: 'effectivePrice',
    direction: 'desc',
  });

  const sortedPositions = useMemo<DisplayPosition[]>(() => {
    return orderBy(
      displayPositions
        .filter(position => (showInactive ? true : !position.isWithdrawn))
        .map(position => ({
          ...position,
          sortValues: {
            type: position.isOpened ? position.orders[0]?.direction : stateToString(position.state),
            tradeAmount: position.isWithdrawn ? 0 : pnum(position.orders[0]?.amount).toNumber(),
            effectivePrice:
              position.isClosed || position.isWithdrawn
                ? 0
                : pnum(position.orders[0]?.effectivePrice).toNumber(),
            basePrice:
              position.isClosed || position.isWithdrawn
                ? 0
                : pnum(position.orders[0]?.basePrice).toNumber(),
            feeTier:
              position.isClosed || position.isWithdrawn ? 0 : Number(position.fee.replace('%', '')),
            positionId: position.idString,
          },
        })),
      `sortValues.${sortBy.key}`,
      sortBy.direction,
    );
  }, [displayPositions, showInactive, sortBy]);

  const SortableTableHeader = useCallback(
    ({ sortKey, children }: { sortKey: string; children: ReactNode }) => {
      return (
        <TableCell heading>
          <button
            className={cn(
              'flex bg-none border-none',
              sortBy.key === sortKey ? 'text-text-primary' : 'text-text-secondary',
            )}
            onClick={() => {
              setSortBy({
                key: sortKey,
                direction: sortBy.key === sortKey && sortBy.direction === 'desc' ? 'asc' : 'desc',
              });
            }}
          >
            <Text tableHeadingSmall whitespace='nowrap'>
              {children}
            </Text>
            {sortKey === sortBy.key && (
              <>
                {sortBy.direction === 'asc' ? (
                  <ChevronUp className='w-4 h-4' />
                ) : (
                  <ChevronDown className='w-4 h-4' />
                )}
              </>
            )}
          </button>
        </TableCell>
      );
    },
    [sortBy, setSortBy],
  );

  const loadingArr = new Array(5).fill({
    position: {},
    orders: [
      {
        baseAsset: {
          asset: {},
        },
        quoteAsset: {
          asset: {},
        },
      },
    ],
  }) as DisplayPosition[];

  useEffect(() => {
    if (data) {
      setPositions(data);
    }
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
    return <ErrorNotice />;
  }

  if (!isLoading && !sortedPositions.length) {
    return <NoPositions />;
  }

  return (
    <div className='p-4 grid grid-cols-[80px_1fr_1fr_80px_1fr_1fr_1fr_1fr] overflow-y-auto overflow-x-auto'>
      <Density slim>
        <div className='grid grid-cols-subgrid col-span-8'>
          <SortableTableHeader sortKey='type'>Type</SortableTableHeader>
          <SortableTableHeader sortKey='tradeAmount'>Trade Amount</SortableTableHeader>
          <SortableTableHeader sortKey='effectivePrice'>Effective Price</SortableTableHeader>
          <SortableTableHeader sortKey='feeTier'>Fee Tier</SortableTableHeader>
          <SortableTableHeader sortKey='basePrice'>Base Price</SortableTableHeader>
          <TableCell heading>Current Value</TableCell>
          <SortableTableHeader sortKey='positionId'>Position ID</SortableTableHeader>
          <TableCell heading>
            <HeaderActionButton displayPositions={sortedPositions} />
          </TableCell>
        </div>

        {(isLoading ? loadingArr : sortedPositions).map((position, index) => (
          <Fragment key={position.idString}>
            {position.orders
              .slice(0, position.isWithdrawn ? 1 : Infinity)
              .map((order, orderIndex) => {
                const isLastCell =
                  index === sortedPositions.length - 1 ||
                  (position.orders.length > 1 && orderIndex === position.orders.length - 1);
                const variant = isLastCell ? 'lastCell' : 'cell';

                return (
                  <div key={orderIndex} className='grid grid-cols-subgrid col-span-8 [&>div]:h-10'>
                    <TableCell loading={isLoading} variant={variant}>
                      {position.isOpened ? (
                        <Text
                          as='div'
                          detail
                          color={order.direction === 'Buy' ? 'success.light' : 'destructive.light'}
                        >
                          {order.direction}
                        </Text>
                      ) : (
                        <Text as='div' detail color='neutral.light'>
                          {stateToString(position.state)}
                        </Text>
                      )}
                    </TableCell>

                    <TableCell variant={variant}>
                      {position.isWithdrawn ? (
                        <Dash />
                      ) : (
                        <ValueViewComponent
                          priority='tertiary'
                          trailingZeros={false}
                          valueView={
                            position.isClosed && orderIndex === 1 ? order.basePrice : order.amount
                          }
                        />
                      )}
                    </TableCell>

                    <TableCell variant={variant}>
                      {position.isClosed || position.isWithdrawn ? (
                        <Dash />
                      ) : (
                        <Tooltip
                          message={
                            <>
                              <Text as='div' detail color='text.primary'>
                                Base price: {pnum(order.basePrice).toFormattedString()}
                              </Text>
                              <Text as='div' detail color='text.primary'>
                                Fee:{' '}
                                {pnum(order.basePrice)
                                  .toBigNumber()
                                  .minus(pnum(order.effectivePrice).toBigNumber())
                                  .toString()}{' '}
                                ({position.fee})
                              </Text>
                              <Text as='div' detail color='text.primary'>
                                Effective price: {pnum(order.effectivePrice).toFormattedString()}
                              </Text>
                            </>
                          }
                        >
                          <ValueViewComponent
                            priority='tertiary'
                            valueView={order.effectivePrice}
                            trailingZeros={false}
                          />
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell variant={variant}>
                      {position.isClosed || position.isWithdrawn ? <Dash /> : position.fee}
                    </TableCell>

                    <TableCell variant={variant}>
                      {position.isClosed || position.isWithdrawn ? (
                        <Dash />
                      ) : (
                        <ValueViewComponent
                          priority='tertiary'
                          valueView={order.basePrice}
                          trailingZeros={false}
                        />
                      )}
                    </TableCell>

                    <TableCell variant={variant}>
                      {position.isWithdrawn ? <Dash /> : <PositionsCurrentValue order={order} />}
                    </TableCell>

                    <TableCell variant={variant}>
                      <div className='flex max-w-[104px]'>
                        <Text as='div' detailTechnical color='text.primary' truncate>
                          {position.idString}
                        </Text>
                        <Link href={`/inspect/lp/${position.idString}`}>
                          <SquareArrowOutUpRight className='w-4 h-4 text-text-secondary' />
                        </Link>
                      </div>
                    </TableCell>

                    <TableCell variant={variant}>
                      <ActionButton id={position.id} position={position.position} />
                    </TableCell>
                  </div>
                );
              })}
          </Fragment>
        ))}
      </Density>
    </div>
  );
});

export default Positions;
