import { useBalances as useCosmosBalances } from '@/features/cosmos/use-augmented-balances';
import { useRegistry } from '@/shared/api/registry';
import { usePenumbraIbcDenoms } from '@/features/penumbra/penumbra-ibc-utils';
import { connectionStore } from '@/shared/model/connection';
import { getMetadataFromBalancesResponse, getBalanceView } from '@penumbra-zone/getters/balances-response';
import { ValueView, Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { useMemo, useEffect } from 'react';
import { useAssetPrices } from './use-asset-prices';
import { useWallet } from '@cosmos-kit/react';
import { WalletStatus } from '@cosmos-kit/core';
import { useBalances as usePenumbraBalances } from '@/shared/api/balances';
import { balanceToValueView } from '@/features/cosmos/utils/balance-to-value-view';

/**
 * Interface representing a unified asset with both shielded and public balances
 */
export interface UnifiedAsset {
  // Common asset information
  symbol: string;
  assetId?: string; // Penumbra asset ID if available
  metadata: Metadata; // Display metadata (name, icon, etc.)

  // Balances
  shieldedBalance: {
    amount: string;
    valueView: ValueView; // Penumbra ValueView for consistent display
    hasError: boolean;
  } | null;

  publicBalance: {
    amount: string;
    denom: string;
    chain?: string; // Source chain information
    valueView?: ValueView; // Converted to ValueView format
    hasError: boolean;
  } | null;

  // Values (priced in USD or stablecoin)
  shieldedValue: number;
  publicValue: number;
  totalValue: number;

  // Capabilities
  canDeposit: boolean;
  canWithdraw: boolean;
  originChain?: string; // Origin chain for deposit/withdraw operations
}

// Helper functions
const getDisplayExponent = (metadata: Metadata): number => {
  if (!metadata.display) {
    return 0;
  }

  const displayUnit = metadata.denomUnits ? metadata.denomUnits.find((unit) => unit.denom === metadata.display) : undefined;
  return displayUnit?.exponent ?? 0;
};

const normalizeSymbol = (symbol: string): string => {
  return symbol.toLowerCase();
};

const shouldFilterAsset = (symbol: string): boolean => {
  const lowerSymbol = symbol.toLowerCase();
  
  return (
    lowerSymbol.startsWith('lpnft') ||
    lowerSymbol.includes('position_id') ||
    lowerSymbol.includes('auction') ||
    (lowerSymbol.includes('delegation') && !lowerSymbol.includes('delegator_reward')) ||
    lowerSymbol.includes('unbonding')
  );
};

/**
 * Determines if an asset can be deposited to Penumbra based on IBC denoms
 */
const canDepositToPenumbra = (symbol: string, ibcDenoms: string[]): boolean => {
  // Consider assets with matching IBC denoms as depositable
  // This is a simplified version - actual logic might be more complex
  if (symbol === 'USDC' || symbol === 'ATOM' || symbol === 'OSMO') {
    return true;
  }
  
  // Check if the symbol appears in IBC denoms
  return ibcDenoms.some(denom => denom.includes(symbol));
};

/**
 * Hook that combines Penumbra (shielded) and Cosmos (public) balances into a unified asset structure
 */
export const useUnifiedAssets = () => {
  // Get Penumbra balances
  const penumbraBalancesResult = usePenumbraBalances();
  const { data: penumbraBalances = [], isLoading: penumbraLoading } = penumbraBalancesResult;

  // Get Cosmos balances and wallet status
  const { balances: cosmosBalances = [], isLoading: cosmosLoading } = useCosmosBalances();
  const { status: cosmosWalletStatus } = useWallet();

  // Get registry and IBC denoms for asset mapping
  const { data: registry, isLoading: registryLoading } = useRegistry();
  const { ibcDenoms: penumbraIbcDenoms = [], isLoading: ibcDenomsLoading } = usePenumbraIbcDenoms();

  // Debugging - log penumbra connection and balances state
  useEffect(() => {
    console.log('Penumbra connection status:', connectionStore.connected);
    console.log('Penumbra balances result:', penumbraBalancesResult);
    console.log('Penumbra balances length:', penumbraBalances?.length || 0);
  }, [penumbraBalances, penumbraBalancesResult]);

  // Get all assets for price data
  const allAssets = useMemo(() => {
    if (!registry) {
      return [];
    }
    return Array.from(registry.getAllAssets());
  }, [registry]);

  // Get price data for all assets
  const { prices = {}, isLoading: pricesLoading } = useAssetPrices(allAssets);

  // Determine if we're ready to process data
  const isLoading =
    penumbraLoading || cosmosLoading || registryLoading || ibcDenomsLoading || pricesLoading;

  // Check connection status
  const isPenumbraConnected = connectionStore.connected;
  const isCosmosConnected = cosmosWalletStatus === WalletStatus.Connected;

  // Create unified assets from Penumbra (shielded) balances
  const shieldedAssets = useMemo(() => {
    console.log('Creating shielded assets. Connected:', isPenumbraConnected, 'Balances:', penumbraBalances?.length || 0);
    
    if (!isPenumbraConnected || !penumbraBalances?.length) {
      console.log('No shielded assets - either not connected or no balances');
      return [];
    }

    return penumbraBalances
      .map(balance => {
        try {
          const metadata = getMetadataFromBalancesResponse(balance);
          const valueView = getBalanceView(balance);
          
          console.log('Processing balance with metadata:', metadata?.symbol);
          
          // Skip if missing necessary data
          if (!metadata?.symbol) {
            return null;
          }
          
          // Filter out special assets
          if (shouldFilterAsset(metadata.symbol)) {
            return null;
          }
          
          // Get display exponent for calculations
          const displayExponent = getDisplayExponent(metadata);
          
          // Debug valueView structure
          console.log('ValueView for', metadata.symbol, ':', JSON.stringify(valueView, null, 2));
          
          // Get amount - using a more robust extraction method
          let amount = '0';
          
          if (valueView.valueView.case === 'knownAssetId') {
            amount = String(valueView.valueView.value.amount);
            console.log('Amount from knownAssetId:', amount);
          } else if (valueView.valueView.case === 'unknownAssetId') {
            amount = String(valueView.valueView.value.amount);
            console.log('Amount from unknownAssetId:', amount);
          }
          
          // Convert to numeric amount
          const numericAmount = Number(amount) / Math.pow(10, displayExponent) || 0;
          console.log('Numeric amount after conversion:', numericAmount, 'Display exponent:', displayExponent);
          
          // Get price information
          const priceData = prices[metadata.symbol];
          let assetValue = 0;
          
          if (priceData?.quoteSymbol === 'USDC' && !isNaN(priceData.price)) {
            // Use price data if available
            assetValue = numericAmount * priceData.price;
          } else if (metadata.symbol === 'USDC') {
            // Special case for USDC
            assetValue = numericAmount;
          }
          
          console.log('Successfully processed shielded asset:', metadata.symbol, 'Amount:', numericAmount);
          
          // Create asset object
          return {
            symbol: metadata.symbol,
            assetId: metadata.penumbraAssetId?.inner.toString('hex'),
            metadata,
            shieldedBalance: {
              amount: numericAmount.toString(),
              valueView,
              hasError: false,
            },
            publicBalance: null,
            shieldedValue: assetValue,
            publicValue: 0,
            totalValue: assetValue,
            canDeposit: false,
            canWithdraw: true,
          };
        } catch (error) {
          console.error('Error processing Penumbra balance', error);
          return null;
        }
      })
      .filter(Boolean) as UnifiedAsset[];
  }, [isPenumbraConnected, penumbraBalances, prices]);

  // Create unified assets from Cosmos (public) balances
  const publicAssets = useMemo(() => {
    if (!isCosmosConnected || !cosmosBalances.length || !registry) {
      return [];
    }

    return cosmosBalances
      .map(balance => {
        try {
          // Skip balances without symbol or special cases
          if (!balance.symbol) {
            return null;
          }
          
          if (balance.chain === 'osmosis-1' && balance.symbol === 'UM') {
            return null;
          }
          
          // Skip if filtered
          if (shouldFilterAsset(balance.symbol)) {
            return null;
          }

          // Create valueView for consistent display
          const valueView = balanceToValueView(balance, registry, penumbraIbcDenoms);
          
          // Skip if we couldn't create a valueView
          if (!valueView) {
            return null;
          }
          
          // Try to find metadata
          let metadata: Metadata;
          
          // Use metadata from valueView if available
          if (valueView.valueView.case === 'knownAssetId' && valueView.valueView.value.metadata) {
            metadata = valueView.valueView.value.metadata;
          } else {
            // Create basic metadata from balance info
            metadata = new Metadata({
              symbol: balance.symbol,
              name: balance.symbol,
              display: balance.denom,
              base: balance.denom,
            });
          }
          
          // Get display exponent
          const displayExponent = getDisplayExponent(metadata);
          
          // Convert to numeric amount
          const numericAmount = Number(balance.amount) / Math.pow(10, displayExponent) || 0;
          
          // Determine if this asset can be deposited to Penumbra
          const canDeposit = canDepositToPenumbra(balance.symbol, penumbraIbcDenoms);
          
          // Get price information
          const priceData = balance.symbol === 'UM' ? prices['UM'] : prices[balance.symbol];
          let assetValue = 0;
          
          if (priceData?.quoteSymbol === 'USDC' && !isNaN(priceData.price)) {
            assetValue = numericAmount * priceData.price;
          } else if (balance.symbol === 'USDC') {
            assetValue = numericAmount;
          }
          
          // Create asset object
          return {
            symbol: balance.symbol,
            assetId: '',
            metadata,
            shieldedBalance: null,
            publicBalance: {
              amount: numericAmount.toString(),
              denom: balance.denom,
              chain: balance.chain,
              valueView,
              hasError: false,
            },
            shieldedValue: 0,
            publicValue: assetValue,
            totalValue: assetValue,
            canDeposit,
            canWithdraw: false,
            originChain: balance.chain,
          };
        } catch (error) {
          console.error('Error processing Cosmos balance', error);
          return null;
        }
      })
      .filter(Boolean) as UnifiedAsset[];
  }, [isCosmosConnected, cosmosBalances, registry, prices, penumbraIbcDenoms]);

  // Merge shielded and public assets
  const unifiedAssets = useMemo(() => {
    const assetMap = new Map<string, UnifiedAsset>();
    
    console.log('Merging assets - Shielded count:', shieldedAssets.length, 'Public count:', publicAssets.length);
    
    // Process shielded assets first
    shieldedAssets.forEach(asset => {
      const key = normalizeSymbol(asset.symbol);
      assetMap.set(key, asset);
    });
    
    // Merge in public assets
    publicAssets.forEach(asset => {
      const key = normalizeSymbol(asset.symbol);
      const existing = assetMap.get(key);
      
      if (existing) {
        // Merge with existing shielded asset
        existing.publicBalance = asset.publicBalance;
        existing.publicValue = asset.publicValue;
        existing.totalValue = existing.shieldedValue + asset.publicValue;
        existing.canDeposit = asset.canDeposit;
        existing.originChain = asset.originChain;
      } else {
        // Add new public-only asset
        assetMap.set(key, asset);
      }
    });
    
    // Convert to array and sort by total value
    return Array.from(assetMap.values())
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [shieldedAssets, publicAssets]);

  // Calculate totals
  const totalShieldedValue = useMemo(() => {
    return unifiedAssets.reduce((total, asset) => total + asset.shieldedValue, 0);
  }, [unifiedAssets]);

  const totalPublicValue = useMemo(() => {
    return unifiedAssets.reduce((total, asset) => total + asset.publicValue, 0);
  }, [unifiedAssets]);

  const totalValue = useMemo(() => {
    return totalShieldedValue + totalPublicValue;
  }, [totalShieldedValue, totalPublicValue]);

  return {
    unifiedAssets,
    totalShieldedValue,
    totalPublicValue,
    totalValue,
    isLoading,
    isPenumbraConnected,
    isCosmosConnected,
  };
};
