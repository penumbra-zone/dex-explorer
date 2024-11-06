import React, { useState } from 'react';
import { useBook } from '../api/book';
import { observer } from 'mobx-react-lite';
import { RouteBookResponse, Trace } from '@/shared/api/server/book/types';
import { ChevronRight } from 'lucide-react';
import { getSymbolFromValueView } from '@penumbra-zone/getters/value-view';
import { usePathSymbols } from '@/pages/trade/model/use-path.ts';

import { Tabs } from '@penumbra-zone/ui/Tabs';

const HopCount = ({ count }: { count: number }) => {
  return (
    <span className={count === 0 ? 'text-white' : 'text-[#F49C43]'}>
      {count === 0 ? 'Direct' : `${count} ${count === 1 ? 'Hop' : 'Hops'}`}
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

const TradeRow = ({ trace, isSell }: { trace: Trace; isSell: boolean }) => {
  const [showRoute, setShowRoute] = useState(false);
  return (
    <tr
      className={`group relative h-[33px] border-b border-[rgba(250,250,250,0.15)]
        ${showRoute ? 'bg-[rgba(250,250,250,0.05)]' : ''}`}
      onClick={() => setShowRoute(prev => !prev)}
    >
      {/*/ !* Liquidity progress bar *!/*/}
      {/* <div className='absolute inset-0 p-0'>
        <div
          className='absolute inset-0 opacity-24'
          style={{
            background: bgColor,
            right: `${100 - liquidityPercentage}%`,
          }}
        />
      </div>*/}

      {showRoute ? (
        <td colSpan={4} className='relative px-4'>
          <RouteDisplay tokens={trace.hops.map(valueView => getSymbolFromValueView(valueView))} />
        </td>
      ) : (
        <>
          <td
            className={
              isSell ? 'text-[#F17878] text-xs relative' : 'text-[#55D383] text-xs relative'
            }
          >
            {trace.price}
          </td>
          <td className='relative text-xs text-right text-white'>{trace.amount}</td>
          <td className='relative text-xs text-right text-white'>{trace.total}</td>
          <td className='relative text-xs text-right'>
            <HopCount count={trace.hops.length} />
          </td>
        </>
      )}
    </tr>
  );
};

export const ROUTEBOOK_TABS = [{ label: 'Route book', value: 'routes' }];

const RouteBookData = observer(({ bookData: { multiHops } }: { bookData: RouteBookResponse }) => {
  const pair = usePathSymbols();

  return (
    <div className='flex flex-col max-w-full border-y border-[#262626]'>
      <div className='flex items-center gap-2 px-4 h-11 border-b border-[#262626]'>
        <Tabs
          value={'routes'}
          onChange={() => {
            undefined;
          }}
          options={ROUTEBOOK_TABS}
          actionType='accent'
        />
      </div>

      <div className='flex-1'>
        <table className='w-full'>
          <thead>
            <tr className='text-xs text-gray-400'>
              <th className='py-[8px] font-normal text-left'>Price({pair.quoteSymbol})</th>
              <th className='py-[8px] font-normal text-right'>Amount({pair.baseSymbol})</th>
              <th className='py-[8px] font-normal text-right'>Total</th>
              <th className='py-[8px] font-normal text-right'>Route</th>
            </tr>
          </thead>

          <tbody className='relative'>
            {multiHops.sell.map((trace, idx) => (
              <TradeRow key={`${trace.price}-${trace.total}-${idx}`} trace={trace} isSell={true} />
            ))}

            <SpreadRow sellOrders={multiHops.sell} buyOrders={multiHops.buy} />
            {multiHops.buy.map((trace, idx) => (
              <TradeRow key={`${trace.price}-${trace.total}-${idx}`} trace={trace} isSell={false} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export const RouteBook = observer(() => {
  const { data: bookData, isLoading: bookIsLoading, error: bookErr } = useBook();

  if (bookIsLoading || !bookData) {
    return <div className='text-gray-400'>Loading...</div>;
  }

  if (bookErr) {
    return <div className='text-red-500'>Error loading route book: {String(bookErr)}</div>;
  }

  return <RouteBookData bookData={bookData} />;
});

const calculateSpread = (sellOrders: Trace[], buyOrders: Trace[]) => {
  if (!sellOrders.length || !buyOrders.length) {
    return null;
  }

  const lowestSell = sellOrders[sellOrders.length - 1]!;
  const highestBuy = buyOrders[0]!;

  const sellPrice = parseFloat(lowestSell.price);
  const buyPrice = parseFloat(highestBuy.price);

  const spread = sellPrice - buyPrice;
  const midPrice = (sellPrice + buyPrice) / 2;
  const spreadPercentage = (spread / midPrice) * 100;

  return {
    amount: spread.toFixed(8),
    percentage: spreadPercentage.toFixed(2),
    midPrice: midPrice.toFixed(8),
  };
};

const SpreadRow = ({ sellOrders, buyOrders }: { sellOrders: Trace[]; buyOrders: Trace[] }) => {
  const spreadInfo = calculateSpread(sellOrders, buyOrders);

  if (!spreadInfo) {
    return null;
  }

  return (
    <tr>
      <td colSpan={4} className='border-y border-[#262626]'>
        <div className='flex items-center justify-center gap-2 px-3 py-3 text-xs'>
          <span className='text-[#55D383]'>{spreadInfo.midPrice}</span>
          <span className='text-gray-400'>Spread:</span>
          <span className='text-white'>{spreadInfo.amount} USDC</span>
          <span className='text-gray-400'>({spreadInfo.percentage}%)</span>
        </div>
      </td>
    </tr>
  );
};

export default RouteBook;
