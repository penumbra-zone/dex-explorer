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

    // Process Penumbra (shielded) balances
    penumbraBalances.forEach(balance => {
      const metadata = getMetadataFromBalancesResponse.optional(balance);
      const valueView = getBalanceView.optional(balance);

      // Skip if we don't have metadata or valueView
      if (!metadata?.symbol || !valueView) {
        return;
      }

      // Filter out NFTs and special assets
      if (
        metadata.symbol.startsWith('lpNft') ||
        metadata.symbol.startsWith('unbond') ||
        metadata.symbol.startsWith('auction')
      ) {
        return;
      }

      // Get or create the unified asset
      let asset = assetMap.get(metadata.symbol);
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
        assetMap.set(metadata.symbol, asset);
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

    // Process Cosmos (public) balances
    cosmosBalances.forEach(balance => {
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

      // Get or create the unified asset
      let asset = assetMap.get(symbol);
      if (!asset) {
        asset = {
          symbol,
          metadata,
          shieldedBalance: null,
          publicBalance: null,
          shieldedValue: 0,
          publicValue: 0,
          totalValue: 0,
          originChain: balance.chain,
          canDeposit: true, // Public assets can be deposited to Penumbra
          canWithdraw: false,
        };
        assetMap.set(symbol, asset);
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
    return Array.from(assetMap.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [penumbraBalances, cosmosBalances, registry, penumbraIbcDenoms]);

  return {
    unifiedAssets,
    isLoading: penumbraLoading || cosmosLoading,
    hasPenumbraAssets: penumbraBalances.length > 0,
    hasCosmosAssets: cosmosBalances.length > 0,
    isPenumbraConnected: connectionStore.connected,
    isCosmosConnected: cosmosBalances.length > 0 || cosmosLoading,
  };
};
