'use client';

import { HistoryTabs } from './history-tabs';
import { RouteTabs } from './route-tabs';
import { MobileTabs } from '@/pages/trade/ui/mobile-tabs';
import { PairInfo } from '@/pages/trade/ui/pair-info';

export const TradePage = () => {
  return (
    <div>
      <hr className='h-[1px] w-full border-t border-t-other-solidStroke' />

      <PairInfo />
      <MobileTabs />

      <RouteTabs />
      <HistoryTabs />
    </div>
  );
};
