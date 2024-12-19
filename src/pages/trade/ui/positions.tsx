'use client';

import { Cell, HeaderCell, LoadingCell } from './market-trades';
import { connectionStore } from '@/shared/model/connection';
import { observer } from 'mobx-react-lite';
import { Text, TextProps } from '@penumbra-zone/ui/Text';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';
import { Density } from '@penumbra-zone/ui/Density';
import { TooltipProvider } from '@penumbra-zone/ui/Tooltip';
import { Tooltip } from '@penumbra-zone/ui/Tooltip';
import { Order, PositionData, stateToString, usePositions } from '@/pages/trade/api/positions.ts';
import {
  PositionId,
  PositionState_PositionStateEnum,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { bech32mPositionId } from '@penumbra-zone/bech32m/plpid';
import { Button } from '@penumbra-zone/ui/Button';
import { positionsStore } from '@/pages/trade/model/positions';
import Link from 'next/link';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useEffect } from 'react';
import { pnum } from '@penumbra-zone/types/pnum';
import { useRegistryAssets } from '@/shared/api/registry';
import { usePathToMetadata } from '../model/use-path';

const LoadingRow = () => {
  return (
    <div className='grid grid-cols-8 text-text-secondary border-b border-other-tonalStroke'>
      {Array.from({ length: 8 }).map((_, index) => (
        <LoadingCell key={index} />
      ))}
    </div>
  );
};

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
        <Button onClick={() => void closePositions([id])} disabled={loading}>
          Close
        </Button>
      );
    } else if (state === PositionState_PositionStateEnum.CLOSED) {
      return (
        <Button disabled={loading} onClick={() => void withdrawPositions([id])}>
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

const AmountDisplay = ({
  p,
  kind,
}: {
  p: PositionData;
  kind: 'tradeAmount' | 'effectivePrice';
}) => {
  if (!p.orders.length) {
    return (
      <Text detail color='text.secondary'>
        -
      </Text>
    );
  }
  return p.orders.map((o, i) => (
    <ValueViewComponent
      valueView={kind === 'tradeAmount' ? o.tradeAmount : o.effectivePrice}
      key={i}
    />
  ));
};

function getWeightedPrice(items: { amount: number; price: number }[]) {
  console.log('TCL: getWeightedPrice -> items', items);
  const totalAmount = items.reduce((acc, item) => acc + item.amount, 0);
  console.log('TCL: getWeightedPrice -> totalAmount', totalAmount);
  const weightedPrice = items.reduce((acc, item) => acc + item.amount * item.price, 0);
  console.log('TCL: getWeightedPrice -> weightedPrice / totalAmount', weightedPrice / totalAmount);
  return totalAmount ? weightedPrice / totalAmount : 0;
}

const MAX_ACTION_COUNT = 15;

const HeaderActionButton = observer(() => {
  const { data } = usePositions();
  const { loading, closePositions, withdrawPositions } = positionsStore;

  const openedPositions =
    data?.filter(p => p.positionState === PositionState_PositionStateEnum.OPENED) ?? [];
  if (openedPositions.length > 1) {
    return (
      <Button
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
    data?.filter(p => p.positionState === PositionState_PositionStateEnum.CLOSED) ?? [];
  if (closedPositions.length > 1) {
    return (
      <Button
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
      <Density compact>
        <div className='pt-4 px-4 pb-0 overflow-x-auto'>
          <div className='sticky top-0 z-10 grid grid-cols-8 text-text-secondary border-b border-other-tonalStroke bg-app-main'>
            <HeaderCell>Type</HeaderCell>
            <HeaderCell>Trade Amount</HeaderCell>
            <HeaderCell>Effective Price</HeaderCell>
            <HeaderCell>Fee Tier</HeaderCell>
            <HeaderCell>Base Price</HeaderCell>
            <HeaderCell>Current Value</HeaderCell>
            <HeaderCell>Position ID</HeaderCell>
            <HeaderCell>{/* <HeaderActionButton /> */}-</HeaderCell>
          </div>

          {isLoading && Array.from({ length: 15 }).map((_, i) => <LoadingRow key={i} />)}

          {displayPositions
            .filter(p => (showInactive ? true : p.isActive))
            .map(p => {
              return (
                <div
                  key={p.positionIdString}
                  className='grid grid-cols-8 border-b border-other-tonalStroke'
                >
                  <Cell>
                    <div className='flex flex-col gap-2'>
                      <Text detail color='text.secondary'>
                        <RowLabel state={p.state} direction={p.direction} />
                      </Text>
                    </div>
                  </Cell>
                  <Cell>
                    <div className='flex flex-col gap-2'>
                      <Text detail color='text.secondary'>
                        <ValueViewComponent valueView={p.amount} trailingZeros={true} />
                      </Text>
                    </div>
                  </Cell>
                  <Cell>
                    <div className='flex flex-col gap-2'>
                      <Text detail color='text.secondary'>
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
                                  {pnum(p.effectivePrice)
                                    .toBigNumber()
                                    .minus(pnum(p.basePrice).toBigNumber())
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
                          <ValueViewComponent valueView={p.effectivePrice} trailingZeros={true} />
                        </Tooltip>
                      </Text>
                    </div>
                  </Cell>
                  <Cell>
                    <div className='tabular-nums'>
                      <Text detailTechnical color='text.primary'>
                        {p.fee}
                      </Text>
                    </div>
                  </Cell>
                  <Cell>
                    <Text detail color='text.secondary'>
                      <ValueViewComponent valueView={p.basePrice} trailingZeros={true} />
                    </Text>
                  </Cell>
                  <Cell>
                    <Text detail color='text.secondary'>
                      {p.currentValue}
                    </Text>
                  </Cell>
                  <Cell>
                    <Text detail color='text.secondary' truncate>
                      {p.id}
                    </Text>
                    <Link href={`/inspect/lp/${p.id}`}>
                      <SquareArrowOutUpRight className='w-4 h-4 text-text-secondary' />
                    </Link>
                  </Cell>
                  <Cell>
                    <ActionButton state={p.state} id={p.id} />
                  </Cell>
                </div>
              );
            })}
        </div>
      </Density>
    </TooltipProvider>
  );
});

export default Positions;
