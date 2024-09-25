'use client';

import { ReactNode } from 'react';
import { PenumbraUIProvider } from '@penumbra-zone/ui/PenumbraUIProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Display } from '@penumbra-zone/ui/Display';
import { Header } from '@/components/header';

const queryClient = new QueryClient();

const V2Layout = ({ children }: { children: ReactNode }) => {
  return (
    <PenumbraUIProvider>
      <QueryClientProvider client={queryClient}>
        <Display>
          <Header />
          {children}
        </Display>
      </QueryClientProvider>
    </PenumbraUIProvider>
  );
};

export default V2Layout;
