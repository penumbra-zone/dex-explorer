import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Tabs } from '@penumbra-zone/ui/Tabs';
import { Density } from '@penumbra-zone/ui/Density';
import { Button } from '@penumbra-zone/ui/Button';
import { Chart } from './chart';
import { MarketTrades } from './market-trades';

enum MobileTabsType {
  Chart = 'chart',
  MarketTrades = 'market-trades',
  MyTrades = 'my-trades',
}

export const MobileTabs = () => {
  const [parent] = useAutoAnimate();

  const [tab, setTab] = useState<MobileTabsType>(MobileTabsType.Chart);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => setCollapsed(prev => !prev);

  return (
    <div ref={parent} className='lg:hidden flex flex-col'>
      <div className='flex justify-between items-center px-4 border-b border-b-other-solidStroke'>
        <Density medium>
          <Tabs
            value={tab}
            actionType='accent'
            onChange={value => setTab(value as MobileTabsType)}
            options={[
              { value: MobileTabsType.Chart, label: 'Chart' },
              { value: MobileTabsType.MarketTrades, label: 'Market Trades' },
              { value: MobileTabsType.MyTrades, label: 'My Trades' },
            ]}
          />
        </Density>

        <Density compact>
          <Button iconOnly icon={collapsed ? ChevronDown : ChevronUp} onClick={toggleCollapsed}>
            Toggle
          </Button>
        </Density>
      </div>

      {!collapsed && (
        <>
          {tab === MobileTabsType.Chart && <Chart />}
          {tab === MobileTabsType.MarketTrades && <MarketTrades />}
          {tab === MobileTabsType.MyTrades && <MarketTrades />}
        </>
      )}
    </div>
  );
};
