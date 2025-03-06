import { useBalances as usePenumbraBalances } from '@/shared/api/balances';
import { useBalances as useCosmosBalances } from '@/features/cosmos/use-augmented-balances';
import { useRegistry } from '@/shared/api/registry';
import { usePenumbraIbcDenoms } from '@/features/penumbra/penumbra-ibc-utils';
import { connectionStore } from '@/shared/model/connection';
import { AddressIndex } from '@penumbra-zone/protobuf/penumbra/core/keys/v1/keys_pb';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { Balance } from '@/features/cosmos/types';
import {
  getMetadataFromBalancesResponse,
  getBalanceView,
} from '@penumbra-zone/getters/balances-response';
import { balanceToValueView } from '@/features/cosmos/utils/balance-to-value-view';
import { Metadata, ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { useMemo } from 'react';
import { assetPatterns } from '@penumbra-zone/types/assets';

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
    chain: string; // Source chain information
    valueView: ValueView; // Converted to ValueView format
    hasError: boolean;
  } | null;

  // Values (priced in USD or stablecoin)
  shieldedValue: number;
  publicValue: number;
  totalValue: number;

  // Asset origin information (for deposit/withdraw)
  originChain?: string;
  canDeposit: boolean;
  canWithdraw: boolean;
}

// Helper function to normalize asset symbols for matching
const normalizeSymbol = (symbol: string): string => {
  if (!symbol) return '';

  // Convert to uppercase
  let normalized = symbol.toUpperCase();

  // Handle special cases for Penumbra's native token
  if (normalized === 'PENUMBRA' || normalized === 'PNMBR') {
    return 'UM';
  }

  // Clean up symbols - remove special characters
  normalized = normalized.replace(/[^A-Z0-9]/g, '');

  return normalized;
};

// Helper function to check if an asset should be filtered out
const shouldFilterAsset = (symbol: string): boolean => {
  if (!symbol) return true;

  const lowerSymbol = symbol.toLowerCase();

  return (
    // LP NFTs
    lowerSymbol.startsWith('lpnft') ||
    // Auction tokens
    lowerSymbol.startsWith('auction') ||
    // Delegation tokens - multiple checks
    assetPatterns.delegationToken.matches(symbol) ||
    lowerSymbol.startsWith('delum') ||
    lowerSymbol.includes('delegation') ||
    // Unbonding tokens - multiple checks
    lowerSymbol.startsWith('unbond') ||
    lowerSymbol.includes('unbonding') ||
    // Other special tokens
    lowerSymbol.includes('voting') ||
    lowerSymbol.includes('vetoken') ||
    lowerSymbol.includes('position-id')
  );
};

/**
 * Hook that combines Penumbra (shielded) and Cosmos (public) balances into a unified asset structure
 */
export const useUnifiedAssets = () => {
  // Get Penumbra balances
  const addressIndex = new AddressIndex({ account: connectionStore.subaccount });
  const { data: penumbraBalances = [], isLoading: penumbraLoading } = usePenumbraBalances(
    addressIndex.account,
  );

  // Get Cosmos balances
  const { balances: cosmosBalances = [], isLoading: cosmosLoading } = useCosmosBalances();

  // Get registry and IBC denoms for asset mapping
  const { data: registry } = useRegistry();
  const { ibcDenoms: penumbraIbcDenoms = [] } = usePenumbraIbcDenoms();

  // Combine balances into unified assets
  const unifiedAssets = useMemo(() => {
    // Create a map to store unified assets by symbol
    const assetMap = new Map<string, UnifiedAsset>();

    // First, process and collect all asset metadata to ensure consistent display
    const metadataMap = new Map<string, Metadata>();

    // Process Penumbra (shielded) balances
    penumbraBalances.forEach(balance => {
      const metadata = getMetadataFromBalancesResponse.optional(balance);
      const valueView = getBalanceView.optional(balance);

      // Skip if we don't have metadata or valueView
      if (!metadata?.symbol || !valueView) {
        return;
      }

      // Filter out special assets for Penumbra
      if (shouldFilterAsset(metadata.symbol)) {
        return;
      }

      // Store the metadata for consistent display
      const normalizedSymbol = normalizeSymbol(metadata.symbol);
      if (!metadataMap.has(normalizedSymbol)) {
        metadataMap.set(normalizedSymbol, metadata);
      }

      // Get or create the unified asset
      let asset = assetMap.get(normalizedSymbol);
      if (!asset) {
        asset = {
          symbol: metadata.symbol,
          assetId: metadata.penumbraAssetId?.inner.toString('hex'),
          metadata,
          shieldedBalance: null,
          publicBalance: null,
          shieldedValue: 0,
          publicValue: 0,
          totalValue: 0,
          canDeposit: false,
          canWithdraw: true, // Penumbra assets can always be withdrawn
        };
        assetMap.set(normalizedSymbol, asset);
      }

      // Get display exponent for value calculation
      let displayExponent = 0;
      if (metadata.denomUnits && metadata.display) {
        const displayUnit = metadata.denomUnits.find(unit => unit.denom === metadata.display);
        if (displayUnit) {
          displayExponent = displayUnit.exponent;
        }
      }

      // Calculate value (placeholder for now, will be replaced with actual pricing)
      const amount = valueView.valueView.value?.amount?.value || '0';
      const numericAmount = Number(amount) / Math.pow(10, displayExponent);

      // Update the asset with shielded balance information
      asset.shieldedBalance = {
        amount: numericAmount.toString(),
        valueView,
        hasError: false,
      };
      asset.shieldedValue = numericAmount; // Placeholder, will be replaced with actual pricing
      asset.totalValue = asset.shieldedValue + asset.publicValue;
    });

    // Special case for UM token - ensure we always have it in the map
    if (!metadataMap.has('UM') && registry) {
      const umAsset = Array.from(registry.getAllAssets()).find(
        asset => asset.symbol.toUpperCase() === 'UM' || asset.symbol.toUpperCase() === 'PENUMBRA',
      );

      if (umAsset) {
        metadataMap.set('UM', umAsset);
        console.log('Added UM metadata to metadata map');
      }
    }

    // Process Cosmos (public) balances - do NOT filter these since they're correctly displayed
    console.log('Processing Cosmos balances:');
    cosmosBalances.forEach(balance => {
      console.log(
        `Cosmos balance: ${balance.symbol}, amount: ${balance.amount}, chain: ${balance.chain}`,
      );

      // Special handling for undefined symbol with large balance on osmosis-1 chain
      // This is likely the Penumbra/UM token
      if (!balance.symbol && balance.chain === 'osmosis-1' && Number(balance.amount) > 1000000) {
        console.log('Found likely UM token with undefined symbol:', balance);

        // Find UM asset in the map
        const umAsset = assetMap.get('UM');
        if (umAsset) {
          console.log('Updating UM asset with osmosis balance');

          // Convert balance to ValueView
          const valueView = registry
            ? balanceToValueView(
                { ...balance, symbol: 'UM' }, // Add the symbol for conversion
                registry,
                penumbraIbcDenoms,
              )
            : null;

          if (valueView) {
            // Get display exponent for value calculation
            let displayExponent = 0;
            if (umAsset.metadata?.denomUnits && umAsset.metadata.display) {
              const displayUnit = umAsset.metadata.denomUnits.find(
                unit => unit.denom === umAsset.metadata.display,
              );
              if (displayUnit) {
                displayExponent = displayUnit.exponent;
              }
            }

            // Calculate value (placeholder for now, will be replaced with actual pricing)
            const numericAmount = Number(balance.amount) / Math.pow(10, displayExponent);

            // Update the asset with public balance information
            umAsset.publicBalance = {
              amount: numericAmount.toString(),
              denom: balance.denom,
              chain: balance.chain,
              valueView,
              hasError: false,
            };
            umAsset.publicValue = numericAmount; // Placeholder, will be replaced with actual pricing
            umAsset.totalValue = umAsset.shieldedValue + umAsset.publicValue;
            umAsset.canDeposit = true;

            // Set origin chain if not already set
            if (!umAsset.originChain) {
              umAsset.originChain = balance.chain;
            }

            console.log('Updated UM asset:', umAsset);
          }
        }

        // Skip normal processing since we've handled this special case
        return;
      }

      if (!registry || !balance.symbol) {
        return;
      }

      // Convert Cosmos balance to Penumbra ValueView for consistent display
      const valueView = balanceToValueView(balance, registry, penumbraIbcDenoms);

      // Extract metadata for matching with Penumbra assets
      let metadata: Metadata | undefined;
      let symbol = balance.symbol;

      if (valueView.valueView.case === 'knownAssetId') {
        metadata = valueView.valueView.value.metadata;
        if (metadata?.symbol) {
          symbol = metadata.symbol;
        }
      }

      if (!metadata) {
        return;
      }

      // Normalize the symbol for consistent matching with Penumbra assets
      const normalizedSymbol = normalizeSymbol(symbol);

      // Special case for Penumbra's native token
      let lookupSymbol = normalizedSymbol;
      if (symbol.toUpperCase() === 'PENUMBRA') {
        lookupSymbol = 'UM';
        console.log('Found PENUMBRA token, using UM as lookup key:', { symbol, lookupSymbol });
      }

      // Use the metadata from Penumbra if available for consistent display
      const preferredMetadata = metadataMap.get(lookupSymbol) || metadata;

      // Get or create the unified asset
      let asset = assetMap.get(lookupSymbol);
      if (!asset) {
        asset = {
          symbol: preferredMetadata.symbol || symbol,
          metadata: preferredMetadata,
          shieldedBalance: null,
          publicBalance: null,
          shieldedValue: 0,
          publicValue: 0,
          totalValue: 0,
          originChain: balance.chain,
          canDeposit: true, // Public assets can be deposited to Penumbra
          canWithdraw: false,
        };
        assetMap.set(lookupSymbol, asset);
        console.log(`Created new asset for ${lookupSymbol}`);
      } else {
        console.log(`Found existing asset for ${lookupSymbol}, updating public balance`);
      }

      // Get display exponent for value calculation
      let displayExponent = 0;
      if (metadata.denomUnits && metadata.display) {
        const displayUnit = metadata.denomUnits.find(unit => unit.denom === metadata.display);
        if (displayUnit) {
          displayExponent = displayUnit.exponent;
        }
      }

      // Calculate value (placeholder for now, will be replaced with actual pricing)
      const numericAmount = Number(balance.amount) / Math.pow(10, displayExponent);

      // Update the asset with public balance information
      asset.publicBalance = {
        amount: numericAmount.toString(),
        denom: balance.denom,
        chain: balance.chain,
        valueView,
        hasError: false,
      };
      asset.publicValue = numericAmount; // Placeholder, will be replaced with actual pricing
      asset.totalValue = asset.shieldedValue + asset.publicValue;

      // Set origin chain if not already set
      if (!asset.originChain) {
        asset.originChain = balance.chain;
      }

      // Enable deposit for public assets
      asset.canDeposit = true;
    });

    // Convert map to array and sort by total value
    const sortedAssets = Array.from(assetMap.values()).sort((a, b) => b.totalValue - a.totalValue);

    // Final debug output
    console.log('Final asset map keys:', Array.from(assetMap.keys()));
    const hasUm = assetMap.has('UM');
    console.log('Has UM token?', hasUm);
    if (hasUm) {
      console.log('UM asset details:', assetMap.get('UM'));
    }

    return sortedAssets;
  }, [penumbraBalances, cosmosBalances, registry, penumbraIbcDenoms]);

  return {
    unifiedAssets,
    isLoading: penumbraLoading || cosmosLoading,
    isPenumbraConnected: connectionStore.connected,
    isCosmosConnected: cosmosBalances.length > 0 || cosmosLoading,
  };
};
