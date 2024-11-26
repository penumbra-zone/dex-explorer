'use client';

import { Cell, HeaderCell, LoadingCell } from './market-trades';
import { connectionStore } from '@/shared/model/connection';
import { observer } from 'mobx-react-lite';
import { Text } from '@penumbra-zone/ui/Text';
import { usePositions } from '@/shared/api/positions.ts';
import { ValueViewComponent } from '@penumbra-zone/ui/ValueView';

const LoadingRow = () => {
  return (
    <div className='grid grid-cols-9 text-text-secondary border-b border-other-tonalStroke'>
      {Array.from({ length: 9 }).map((_, index) => (
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

const ErrorNotice = ({ error }: { error: unknown }) => {
  return (
    <div className='p-5'>
      <Text small color='destructive.light'>
        {String(error)}
      </Text>
    </div>
  );
};

export const Positions = observer(() => {
  const { connected } = connectionStore;
  const { data, isLoading, error } = usePositions();

  if (!connected) {
    return <NotConnectedNotice />;
  }

  if (error) {
    return <ErrorNotice error={error} />;
  }

  return (
    <div className='pt-4 px-4 pb-0 overflow-auto'>
      <div className='sticky top-0 z-10 grid grid-cols-9 text-text-secondary border-b border-other-tonalStroke bg-app-main'>
        <HeaderCell>Time</HeaderCell>
        <HeaderCell>Side</HeaderCell>
        <HeaderCell>Trade Amount</HeaderCell>
        <HeaderCell>Effective Price</HeaderCell>
        <HeaderCell>Fee Tier</HeaderCell>
        <HeaderCell>Current Value</HeaderCell>
        <HeaderCell>Status</HeaderCell>
        <HeaderCell>Position ID</HeaderCell>
        <HeaderCell>Actions</HeaderCell>
      </div>

      {isLoading && Array.from({ length: 15 }).map((_, i) => <LoadingRow key={i} />)}

      {data
        ?.filter(p => p.positionState === 'OPENED')
        .map(p => (
          <div key={p.positionId} className='grid grid-cols-9 border-b border-other-tonalStroke'>
            <Cell>
              <Text color='text.secondary'>-</Text>
            </Cell>
            <Cell>
              <Text color='text.secondary'>-</Text>
            </Cell>
            <Cell>
              <ValueViewComponent valueView={p.asset1} context='table' />
            </Cell>
            <Cell>
              <ValueViewComponent valueView={p.asset2} context='table' />
            </Cell>
            <Cell>
              <Text color='text.secondary'>{p.fee}%</Text>
            </Cell>
            <Cell>
              <Text color='text.secondary'>-</Text>
            </Cell>
            <Cell>
              <Text color='text.secondary'>{p.positionState}</Text>
            </Cell>
            <Cell>
              <Text color='text.secondary'>{p.positionId}</Text>
            </Cell>
            <Cell>
              <Text color='text.secondary'>-</Text>
            </Cell>
          </div>
        ))}
    </div>
  );
});
