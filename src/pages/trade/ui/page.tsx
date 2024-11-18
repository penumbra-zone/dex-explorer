'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Tabs } from '@penumbra-zone/ui/Tabs';
import { Density } from '@penumbra-zone/ui/Density';
import { Button } from '@penumbra-zone/ui/Button';
import { PairSelector } from './pair-selector';
import { Chart } from './chart';
import { Summary } from './summary';
import { MarketTrades } from './market-trades';
import { HistoryTabs } from './history-tabs';
import { RouteTabs } from './route-tabs';

export const TradePage = () => {
  const [mobileTab, setMobileTab] = useState<string>('chart');

  return (
    <div>
      <hr className='h-[1px] w-full border-t border-t-other-solidStroke' />

      <div className='flex flex-col items-start desktop:items-center desktop:flex-row p-4 gap-4 border-b border-b-other-solidStroke'>
        <div className='flex gap-2 h-8'>
          <PairSelector />
        </div>
        <Summary />
      </div>

      <div className='flex justify-between items-center px-4 border-b border-b-other-solidStroke'>
        <Density medium>
          <Tabs
            value={mobileTab}
            actionType='accent'
            onChange={setMobileTab}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'market-trades', label: 'Market Trades' },
              { value: 'my-trades', label: 'My Trades' },
            ]}
          />
        </Density>

        <Density compact>
          <Button iconOnly icon={ChevronDown}>
            Toggle
          </Button>
        </Density>
      </div>

      {mobileTab === 'chart' && <Chart />}
      {mobileTab === 'market-trades' && <MarketTrades />}
      {mobileTab === 'my-trades' && <MarketTrades />}

      <RouteTabs />
      <HistoryTabs />
    </div>
  );
};
