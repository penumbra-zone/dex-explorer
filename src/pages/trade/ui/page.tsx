'use client';

import cn from 'clsx';
import { PairInfo } from './pair-info';
import { Chart } from './chart';
import { RouteTabs } from './route-tabs';
import { TradesTabs } from './trades-tabs';
import { HistoryTabs } from './history-tabs';
import { FormTabs } from './form-tabs';

const sharedStyle = 'w-full border-t border-t-other-solidStroke overflow-x-hidden';

// extra large grid (>1600px)
const XlLayout = () => {
  return (
    <div className={cn(sharedStyle, 'hidden xl:grid xl:grid-cols-[1fr,320px]')}>
      <div className='flex flex-col gap-2'>
        <div className='grid grid-cols-[1fr,1fr,320px]'>
          <div className='col-span-2 grid grid-rows-[auto,1fr]'>
            <PairInfo />
            <Chart />
          </div>
          <RouteTabs />
        </div>
        <HistoryTabs />
      </div>
      <div className='flex flex-col gap-4'>
        <FormTabs />
        <TradesTabs />
      </div>
    </div>
  );
};

// large grid (>1200px)
const LLayout = () => {
  return (
    <div className={cn(sharedStyle, 'hidden lg:grid xl:hidden lg:grid-cols-[1fr,320px]')}>
      <div className='col-span-2'>
        <PairInfo />
      </div>
      <div className='flex flex-col gap-2'>
        <div className='grid grid-cols-[1fr,1fr,320px]'>
          <div className='col-span-2'>
            <Chart />
          </div>
          <RouteTabs />
        </div>
        <HistoryTabs />
      </div>
      <div className='flex flex-col gap-4'>
        <FormTabs />
        <TradesTabs />
      </div>
    </div>
  );
};

// desktop grid (>900px)
const DesktopLayout = () => {
  return (
    <div
      className={cn(sharedStyle, 'hidden desktop:grid lg:hidden desktop:grid-cols-[1fr,1fr,320px]')}
    >
      <div className='col-span-3'>
        <PairInfo />
      </div>
      <div className='flex flex-col gap-2 col-span-2'>
        <div className='grid grid-cols-[1fr,1fr] grid-rows-[auto,1fr]'>
          <div className='col-span-2 h-[650px]'>
            <Chart />
          </div>
          <RouteTabs />
          <TradesTabs />
        </div>
      </div>
      <FormTabs />
      <div className='col-span-3'>
        <HistoryTabs />
      </div>
    </div>
  );
};

// tablet grid (600px)
const TabletLayout = () => {
  return (
    <div
      className={cn(sharedStyle, 'hidden tablet:grid desktop:hidden tablet:grid-cols-[1fr,1fr]')}
    >
      <div className='col-span-2'>
        <PairInfo />
      </div>
      <div className='col-span-2'>
        <TradesTabs withChart />
      </div>
      <RouteTabs />
      <FormTabs />
      <div className='col-span-2'>
        <HistoryTabs />
      </div>
    </div>
  );
};

// mobile grid (<600px)
const MobileLayout = () => {
  return (
    <div className={cn(sharedStyle, 'hidden mobile:grid tablet:hidden mobile:grid-cols-[1fr]')}>
      <PairInfo />
      <TradesTabs withChart />
      <FormTabs />
      <RouteTabs />
      <HistoryTabs />
    </div>
  );
};

export const TradePage = () => {
  return (
    <>
      <XlLayout />
      <LLayout />
      <DesktopLayout />
      <TabletLayout />
      <MobileLayout />
    </>
  );
};
