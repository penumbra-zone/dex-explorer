import { useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Tabs } from '@penumbra-zone/ui/Tabs';
import { Density } from '@penumbra-zone/ui/Density';

enum FormTabsType {
  Market = 'market',
  Limit = 'limit',
  Range = 'range',
}

export const FormTabs = () => {
  const [parent] = useAutoAnimate();
  const [tab, setTab] = useState<FormTabsType>(FormTabsType.Market);

  return (
    <div ref={parent} className='flex flex-col border-b border-b-other-solidStroke'>
      <div className='px-4 border-b border-b-other-solidStroke'>
        <Density medium>
          <Tabs
            value={tab}
            actionType='accent'
            onChange={value => setTab(value as FormTabsType)}
            options={[
              { value: FormTabsType.Market, label: 'Market' },
              { value: FormTabsType.Limit, label: 'Limit' },
              { value: FormTabsType.Range, label: 'Range Liquidity' },
            ]}
          />
        </Density>
      </div>

      {tab === FormTabsType.Market && (
        <div className='h-[380px] p-4 text-text-secondary'>
          Order form
        </div>
      )}
      {tab === FormTabsType.Limit && (
        <div className='h-[380px] p-4 text-text-secondary'>
          Limit order form
        </div>
      )}
      {tab === FormTabsType.Range && (
        <div className='h-[380px] p-4 text-text-secondary'>
          Range liquidity form
        </div>
      )}
    </div>
  );
};
