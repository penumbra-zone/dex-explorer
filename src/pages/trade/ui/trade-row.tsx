import { Trace } from '@/shared/api/server/book/types.ts';
import { getSymbolFromValueView } from '@penumbra-zone/getters/value-view';
import React from 'react';
import { ChevronRight } from 'lucide-react';

function formatPrice(price: string): string {
  const num = parseFloat(price);
  const parts = num.toString().split('.');
  const whole = parts[0] ?? '0';
  const totalDigits = 7;
  const availableDecimals = Math.max(0, totalDigits - whole.length);
  return num.toFixed(availableDecimals);
}

function formatNumber(value: string): string {
  const num = parseFloat(value);
  const parts = num.toString().split('.');
  const whole = parts[0] ?? '0';
  const totalDigits = 6;
  const availableDecimals = Math.max(0, totalDigits - whole.length);
  return num.toFixed(availableDecimals);
}

const SELL_BG_COLOR = 'rgba(175, 38, 38, 0.24)';
export const TradeRow = ({
  trace,
  isSell,
  relativeSize,
}: {
  trace: Trace;
  isSell: boolean;
  relativeSize: number;
}) => {
  const bgColor = isSell ? SELL_BG_COLOR : 'rgba(28, 121, 63, 0.24)';

  return (
    <tr
      className='h-[33px] border-b border-border-faded group text-[12px]'
      style={{
        backgroundImage: `linear-gradient(to right, ${bgColor} ${relativeSize}%, transparent ${relativeSize}%)`,
      }}
    >
      <td className={`${isSell ? 'text-red-400' : 'text-green-400'} px-4`}>
        {formatPrice(trace.price)}
      </td>
      <td className='text-right text-white '>{formatNumber(trace.amount)}</td>
      <td className='text-right text-white'>{formatNumber(trace.total)}</td>
      <td className='text-right'>
        <HopCount count={trace.hops.length} />
      </td>

      {/* Overlay row that appears on hover */}
      {/* eslint-disable-next-line react/no-unknown-property -- JSX style is valid in nextjs */}
      <style jsx>{`
        tr:hover td {
          visibility: hidden;
        }
        tr:hover::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 33px;
          background: rgba(250, 250, 250, 0.05);
        }
      `}</style>

      {/* Route display that shows on hover */}
      <td
        className='hidden group-hover:flex justify-center absolute left-0 right-0 px-4 select-none z-30'
        colSpan={4}
        style={{ visibility: 'visible' }}
      >
        <RouteDisplay tokens={trace.hops.map(valueView => getSymbolFromValueView(valueView))} />
      </td>
    </tr>
  );
};

const HopCount = ({ count }: { count: number }) => {
  return (
    <span className={count === 0 ? 'text-white' : 'text-orange-400'}>
      {count === 2 ? 'Direct' : `${count - 2} Hops`}
    </span>
  );
};

const RouteDisplay = ({ tokens }: { tokens: string[] }) => {
  return (
    <div className='flex items-center gap-1 py-2 text-xs text-white'>
      {tokens.map((token, index) => (
        <React.Fragment key={token}>
          {index > 0 && <ChevronRight className='w-3 h-3 text-gray-400' />}
          <span>{token}</span>
        </React.Fragment>
      ))}
    </div>
  );
};
