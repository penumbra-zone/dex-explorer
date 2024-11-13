import { Density } from '@penumbra-zone/ui/Density';
import { HeaderLogo } from './logo';
import { StatusPopover } from './status-popover';
import { MobileNav } from './mobile-nav';
import { DesktopNav } from './desktop-nav';
import { Connection } from './connection';
import PenumbraWaves from './penumbra-waves.svg';

export const Header = () => {
  return (
    <header className='flex items-center justify-between py-5'>
      <PenumbraWaves className='w-screen h-[100vw] -translate-y-[70%] scale-150 fixed -z-[1] pointer-events-none top-0 left-0 desktop:scale-100 desktop:w-[80vw] desktop:h-[80vw] desktop:-translate-y-3/4 desktop:left-[10vw]' />

      <HeaderLogo />

      <DesktopNav />

      <Density compact>
        <div className='hidden gap-2 lg:flex'>
          <StatusPopover />
          <Connection />
        </div>
        <div className='block lg:hidden'>
          <MobileNav />
        </div>
      </Density>
    </header>
  );
};
