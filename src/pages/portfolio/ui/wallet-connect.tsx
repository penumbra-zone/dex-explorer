import React, { useMemo } from 'react';
import { Text } from '@penumbra-zone/ui/Text';
import { Shield, Eye } from 'lucide-react';
import { ConnectButton } from '@/features/connect/connect-button';
import { observer } from 'mobx-react-lite';
import { CosmosConnectButton } from '@/features/cosmos/cosmos-connect-button.tsx';
import { useUnifiedAssets } from '../api/use-unified-assets.ts';
import { Skeleton } from '@penumbra-zone/ui/Skeleton';

export const WalletConnect = observer((props: { onboardingDismissed: boolean }) => {
  const { isPenumbraConnected, isCosmosConnected, totalPublicValue, totalShieldedValue } =
    useUnifiedAssets();

  // Format the values with commas and 2 decimal places
  const formattedShieldedValue = useMemo(() => {
    return totalShieldedValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [totalShieldedValue]);

  const formattedPublicValue = useMemo(() => {
    return totalPublicValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [totalPublicValue]);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
      {/* Shielded Assets Card */}
      <div className='relative bg-accentRadialBackground rounded-2xl p-6 flex space-between'>
        <div className='absolute top-6 right-6'>
          <Shield className='text-white opacity-10 w-8 h-8' />
        </div>
        <div
          className={`flex flex-col items-start ${props.onboardingDismissed ? 'gap-6' : 'gap-2'} h-full justify-between`}
        >
          <Text color='text.secondary'>Shielded Assets</Text>

          {/* eslint-disable-next-line no-nested-ternary -- no match expression */}
          {isPenumbraConnected ? (
            // Show total asset value when connected
            <div className='space-y-2'>
              <div className='text-3xl font-mono text-primary-light'>
                {formattedShieldedValue} USDC
              </div>
            </div>
          ) : props.onboardingDismissed ? (
            <>
              <div className='space-y-2 text-3xl'>
                <Text xxl color='text.primary'>
                  Connect your <span className='text-primary-light'>Prax Wallet</span> to access
                  shielded assets and liquidity positions
                </Text>
              </div>
              <div className={'w-fit'}>
                <ConnectButton
                  variant={isCosmosConnected ? 'minimal' : 'default'}
                  actionType='accent'
                />
              </div>
            </>
          ) : (
            <div className='w-[100px] h-[24px]'>
              <Skeleton />
            </div>
          )}
        </div>
      </div>

      {/* Public Assets Card */}
      <div className='relative bg-unshieldRadialBackground rounded-2xl p-6 flex space-between'>
        <div className='absolute top-6 right-6'>
          <Eye className='text-white opacity-10 w-8 h-8' />
        </div>
        <div className='flex flex-col gap-2 h-full justify-between'>
          <Text color='text.secondary'>Public Assets</Text>

          {/* eslint-disable-next-line no-nested-ternary -- no match expression */}
          {isCosmosConnected ? (
            // Show total public asset value when connected
            <div className='space-y-2'>
              <div className='text-3xl font-mono text-unshield-light'>
                {formattedPublicValue} USDC
              </div>
            </div>
          ) : props.onboardingDismissed ? (
            <>
              <div className='space-y-2 text-3xl'>
                <Text xxl color='text.primary'>
                  Connect your <span className='text-unshield-light'>Cosmos Wallet</span> to manage
                  public assets and shield them in Penumbra
                </Text>
              </div>
              <div className={'w-fit'}>
                <CosmosConnectButton
                  variant={isPenumbraConnected ? 'minimal' : 'default'}
                  actionType='unshield'
                />
              </div>
            </>
          ) : (
            <div className='w-[100px] h-[24px]'>
              <Skeleton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
