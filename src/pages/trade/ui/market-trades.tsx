import { ReactNode } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { TableCell } from '@penumbra-zone/ui/TableCell';
import { Density } from '@penumbra-zone/ui/Density';
import { Skeleton } from '@penumbra-zone/ui/Skeleton';
import { useRecentExecutions } from '../api/recent-executions.ts';

export const Cell = ({ children }: { children: ReactNode }) => {
  return <div className='flex items-center py-1.5 px-3 min-h-12'>{children}</div>;
};

export const LoadingCell = () => {
  return (
    <Cell>
      <div className='w-12 h-4'>
        <Skeleton />
      </div>
    </Cell>
  );
};

const ErrorState = ({ error }: { error: Error }) => {
  return <div className='text-red-500'>{String(error)}</div>;
};

const formatLocalTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const MarketTrades = () => {
  const { data, isLoading, error } = useRecentExecutions();
  const [parent] = useAutoAnimate();

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
          <div key={trade.timestamp + trade.amount} className='grid grid-cols-subgrid col-span-4'>
            <TableCell
              numeric
              variant={index !== data.length - 1 ? 'cell' : 'lastCell'}
              loading={isLoading}
            >
              <span
                className={trade.kind === 'buy' ? 'text-success-light' : 'text-destructive-light'}
              >
                {trade.price}
              </span>
            </TableCell>
            <TableCell cell numeric loading={isLoading}>
              {trade.amount}
            </TableCell>
            <TableCell cell numeric loading={isLoading}>
              {formatLocalTime(trade.timestamp)}
            </TableCell>
            <TableCell cell loading={isLoading}>
              --
            </TableCell>
          </div>
        ))}
      </div>
    </Density>
  );
};
