import React, { useMemo } from 'react';
import { Text } from '@penumbra-zone/ui/Text';
import { Shield, Eye } from 'lucide-react';
import { ConnectButton } from '@/features/connect/connect-button';
import { observer } from 'mobx-react-lite';
import { CosmosConnectButton } from '@/features/cosmos/cosmos-connect-button.tsx';
import { useUnifiedAssets } from '../hooks/use-unified-assets';

export const WalletConnect = observer(() => {
  const { unifiedAssets, isPenumbraConnected, isCosmosConnected } = useUnifiedAssets();

  // Calculate the total value of all shielded assets (Penumbra)
  const totalShieldedValue = useMemo(() => {
    if (!Array.isArray(unifiedAssets) || unifiedAssets.length === 0) {
      return 0;
    }

    return unifiedAssets.reduce((total, asset) => total + asset.shieldedValue, 0);
  }, [unifiedAssets]);

  // Calculate the total value of all public assets (Cosmos)
  const totalPublicValue = useMemo(() => {
    if (!Array.isArray(unifiedAssets) || unifiedAssets.length === 0) {
      return 0;
    }

    return unifiedAssets.reduce((total, asset) => total + asset.publicValue, 0);
  }, [unifiedAssets]);

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
      <div className='relative bg-radial-prax rounded-2xl p-6 md:p-8 flex space-between h-[420px]'>
        <div className='absolute top-6 right-6'>
          <Shield className='text-white opacity-10 w-8 h-8' />
        </div>
        <div className='flex flex-col gap-6 h-full justify-between'>
          <Text large color='text.primary'>
            Shielded Assets
          </Text>

          {isPenumbraConnected ? (
            // Show total asset value when connected
            <div className='space-y-2'>
              <div className='text-7xl font-mono text-[#F49C43]'>{formattedShieldedValue} USDC</div>
            </div>
          ) : (
            // Show connect prompt when not connected
            <div className='space-y-2 text-3xl'>
              <Text large color='text.primary'>
                Connect your <span className='text-[#F49C43]'>Prax Wallet</span> to
              </Text>
              <Text large color='text.primary'>
                access shielded assets and liquidity positions
              </Text>
            </div>
          )}

          {!isPenumbraConnected && <ConnectButton variant='default' actionType='default' />}
        </div>
      </div>

      {/* Public Assets Card */}
      <div className='relative bg-radial-cosmos rounded-2xl p-6 md:p-8 flex space-between h-[420px]'>
        <div className='absolute top-6 right-6'>
          <Eye className='text-white opacity-10 w-8 h-8' />
        </div>
        <div className='flex flex-col gap-6 h-full justify-between'>
          <Text large color='text.primary'>
            Public Assets
          </Text>

          {isCosmosConnected ? (
            // Show total public asset value when connected
            <div className='space-y-2'>
              <div className='text-7xl font-mono text-[#6F6E84]'>{formattedPublicValue} USDC</div>
            </div>
          ) : (
            // Show connect prompt when not connected
            <div className='space-y-2 text-3xl'>
              <Text large color='text.primary'>
                Connect your <span className='text-[#A3A3A3]'>Cosmos Wallet</span> to
              </Text>
              <Text large color='text.primary'>
                manage public assets and shield them in Penumbra
              </Text>
            </div>
          )}

          <CosmosConnectButton variant='default' actionType='default' />
        </div>
      </div>
    </div>
  );
});
