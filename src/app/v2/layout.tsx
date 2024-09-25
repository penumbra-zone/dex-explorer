'use client';

import { ReactNode } from 'react';
import { PenumbraUIProvider } from '@penumbra-zone/ui/PenumbraUIProvider';
import { Display } from '@penumbra-zone/ui/Display';
import { Header } from '@/components/header';
import { SyncBar } from '@/components/header/sync-bar';
import { useGlobalState } from '@/state';

const V2Layout = ({ children }: { children: ReactNode }) => {
  useGlobalState();

  return (
    <PenumbraUIProvider>
      <Display>
        <SyncBar />
        <Header />
        {children}
      </Display>
    </PenumbraUIProvider>
  )
};

export default V2Layout;
