'use client';

import { ReactNode } from 'react';
import { PenumbraUIProvider } from '@penumbra-zone/ui/PenumbraUIProvider';
import { Display } from '@penumbra-zone/ui/Display';
import { Header } from '../../components/header';
import { SyncBar } from '@/components/header/sync-bar';
import { enableStaticRendering } from 'mobx-react-lite';

// Used so that observer() won't subscribe to any observables used in an SSR environment
// and no garbage collection problems are introduced.
enableStaticRendering(typeof window === 'undefined');

const V2Layout = ({ children }: { children: ReactNode }) => {
  return (
    <PenumbraUIProvider>
      <Display>
        <SyncBar />
        <Header />
        {children}
      </Display>
    </PenumbraUIProvider>
  );
};

export default V2Layout;
