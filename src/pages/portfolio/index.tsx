'use client';

import React from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '@penumbra-zone/ui/Button';
import { Text } from '@penumbra-zone/ui/Text';
import { Density } from '@penumbra-zone/ui/Density';
import mobile from 'is-mobile';

export const PortfolioPage = () => {
  const isOnMobile = mobile();

  return isOnMobile ? (
    <section className='absolute inset-0 flex flex-col items-center justify-between p-4 gap-3 border-t  border-neutral-800'>
      <div className='flex flex-col justify-center items-center p-0 gap-4 w-full flex-grow'>
        <div className='relative'>
          <XCircle className='text-neutral-400  w-8 h-8' />
        </div>

        <Text color={'text.secondary'} align={'center'} small={true}>
          This page requires a connection to your wallet, please switch to a desktop device.
        </Text>

        <Density compact={true}>
          {/* Copy Link Button */}
          <Button
            onClick={() => {
              // We discard the promise using void,
              // because Button only expects void-returning functions.
              void (async () => {
                const currentUrl = window.location.href;
                await navigator.clipboard.writeText(currentUrl);
              })();
            }}
          >
            Copy Link
          </Button>
        </Density>
      </div>

      {/* Go Back Button */}
      <Button>
        <span className="text-sm font-medium text-white font-['Poppins']">Go Back</span>
      </Button>
    </section>
  ) : (
    'Hi from desktop!'
  );
};
