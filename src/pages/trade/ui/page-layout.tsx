import { PairInfo } from './pair-info';
import { Chart } from './chart';
import { RouteTabs } from './route-tabs';
import { MobileTabs } from './mobile-tabs';
import { HistoryTabs } from './history-tabs';
import { FormTabs } from './form-tabs';

export const PageLayout = () => {
  return (
    <div className='lg:grid lg:grid-cols-[1fr,320px] overflow-x-hidden overflow-y-auto'>
      <div className='lg:grid lg:grid-cols-[1fr,320px] lg:grid-rows-[400px,1fr]'>
        <div className='flex flex-col grow min-h-full border-r border-r-other-solidStroke'>
          <PairInfo />

          <MobileTabs />

          <div className='block lg:hidden'>
            <FormTabs />
          </div>

          <div className='hidden lg:block grow'>
            <Chart />
          </div>
        </div>

        <RouteTabs />

        <HistoryTabs />
      </div>

      <div className='hidden lg:flex flex-col min-w-[320px] grow'>
        <FormTabs />
        <MobileTabs noChart />
      </div>
    </div>
  );
};
