import cn from 'clsx';
import { Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import { ChevronRight } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import { Density } from '@penumbra-zone/ui/Density';
import { Text } from '@penumbra-zone/ui/Text';
import { pluralize } from '@/shared/utils/pluralize';
import { useLatestSwaps } from '@/pages/trade/api/latest-swaps';
import { connectionStore } from '@/shared/model/connection';
import { pnum } from '@penumbra-zone/types/pnum';
import { ErrorState, formatLocalTime } from './shared';

export const MyTrades = observer(() => {
  const { subaccount } = connectionStore;
  const { data, isLoading, error } = useLatestSwaps(subaccount);
  const [parent] = useAutoAnimate();

  // TODO: replace with real data
  const type = 'sell' as string;
  const timestemp = '1738235546706' as string;
  const hops = ['um', 'usdc'];

  return (
    <Density slim>
      <div ref={parent} className='grid grid-cols-4 pt-4 px-4 pb-0 h-auto overflow-auto'>
        <div className='grid grid-cols-subgrid col-span-4'>
          <TableCell heading>Price</TableCell>
          <TableCell heading>Amount</TableCell>
          <TableCell heading>Time</TableCell>
          <TableCell heading>Route</TableCell>
        </div>

        {error && <ErrorState error={error} />}

        {data?.map((trade, index) => (
          <div
            key={index}
            className={cn(
              'relative grid grid-cols-subgrid col-span-4',
              'group [&:hover>div:not(:last-child)]:invisible',
            )}
          >
            <TableCell
              numeric
              variant={index !== data.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              <span className={type === 'buy' ? 'text-success-light' : 'text-destructive-light'}>
                {trade.input?.amount && pnum(trade.input.amount).toFormattedString()}
              </span>
            </TableCell>
            <TableCell
              variant={index !== data.length - 1 ? 'cell' : 'lastCell'}
              numeric
              loading={isLoading}
            >
              {trade.output?.amount && pnum(trade.output.amount).toFormattedString()}
            </TableCell>
            <TableCell
              variant={index !== data.length - 1 ? 'cell' : 'lastCell'}
              numeric
              loading={isLoading}
            >
              {formatLocalTime(timestemp)}
            </TableCell>
            <TableCell
              variant={index !== data.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              <Text
                as='span'
                color={hops.length <= 2 ? 'text.primary' : 'text.special'}
                whitespace='nowrap'
                detailTechnical
              >
                {hops.length === 2 ? 'Direct' : pluralize(hops.length - 2, 'Hop', 'Hops')}
              </Text>
            </TableCell>

            {/* Route display that shows on hover */}
            <div
              className={cn(
                'hidden group-hover:flex justify-center items-center gap-1',
                'absolute left-0 right-0 w-full h-full px-4 z-30 select-none border-b border-b-other-tonalStroke',
              )}
            >
              {hops.map((token, index) => (
                <Fragment key={index}>
                  {index > 0 && <ChevronRight className='w-3 h-3 text-neutral-light text-xs' />}
                  <Text tableItemSmall color='text.primary'>
                    {token}
                  </Text>
                </Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Density>
  );
});
