'use client';

import { ReactNode, useEffect } from 'react';
import { enableStaticRendering, observer } from 'mobx-react-lite';
import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@penumbra-zone/ui/Toast';
import { TooltipProvider } from '@penumbra-zone/ui/Tooltip';
import { Header, SyncBar } from '@/widgets/header';
import { queryClient } from '@/shared/const/queryClient';
import { connectionStore } from '@/shared/model/connection';

// Used so that observer() won't subscribe to any observables used in an SSR environment
// and no garbage collection problems are introduced.
enableStaticRendering(typeof window === 'undefined');

const SetupConnection = observer(() => {
  useEffect(() => {
    connectionStore.setup();
  }, []);
  return null;
});

export const App = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <main className='relative z-0'>
          <SyncBar />
          <SetupConnection />
          <Header />
          {children}
        </main>
        <ToastProvider />
      </TooltipProvider>
    </QueryClientProvider>
  );
};
