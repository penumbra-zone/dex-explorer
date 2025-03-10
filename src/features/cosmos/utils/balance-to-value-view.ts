import { Registry } from '@penumbra-labs/registry';
import {
  AssetId,
  Metadata,
  ValueView,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { toValueView } from '@/shared/utils/value-view';
import { Balance } from '@/features/cosmos/types';

/**
 * Converts a Cosmos balance to a Penumbra ValueView
 * This allows us to integrate Cosmos balances with Penumbra UI components
 *
 * @param balance The Cosmos balance to convert
 * @param registry The Penumbra registry for asset lookup
 * @param penumbraIbcDenoms List of IBC denoms that represent Penumbra tokens on other chains
 * @returns A ValueView that can be used with Penumbra UI components
 */
export const balanceToValueView = (
  balance: Balance,
  registry: Registry | undefined,
  penumbraIbcDenoms: string[] = [],
): ValueView => {
  try {
    // Find matching asset in registry
    if (!registry) {
      throw new Error('Registry not available');
    }

    // Try to match by IBC denom or symbol
    let metadata: Metadata | undefined;

    // For IBC denoms - check if it's a Penumbra asset
    if (balance.denom.startsWith('ibc/')) {
      const isPenumbraAsset = penumbraIbcDenoms.includes(balance.denom);

      if (isPenumbraAsset) {
        // If it's a Penumbra asset, get the Penumbra token metadata
        const allAssets = registry.getAllAssets();
        // Find staking token (Penumbra) metadata
        const penumbraMetadata = allAssets.find(
          asset => asset.symbol.toUpperCase() === 'UM' || asset.symbol.toUpperCase() === 'PENUMBRA',
        );

        if (penumbraMetadata) {
          metadata = penumbraMetadata;
        }
      } else {
        // Try to find other IBC assets
        const allAssets = registry.getAllAssets();
        // Since we can't directly access properties of asset, we need to check symbol
        // against what we expect from the balance
        if (balance.symbol) {
          const matchingAsset = allAssets.find(
            asset => asset.symbol.toLowerCase() === balance.symbol?.toLowerCase(),
          );

          if (matchingAsset) {
            metadata = matchingAsset;
          }
        }
      }
    }
    // For native denoms
    else if (balance.symbol) {
      // Get all assets and find one with matching symbol
      const allAssets = registry.getAllAssets();
      const matchingAsset = allAssets.find(
        asset => asset.symbol.toLowerCase() === balance.symbol?.toLowerCase(),
      );

      if (matchingAsset) {
        metadata = matchingAsset;
      }
    }

    if (metadata) {
      // Use the toValueView utility to create a KnownAssetId ValueView
      const amountInBaseUnits = parseInt(balance.amount);

      return toValueView({
        amount: amountInBaseUnits,
        metadata,
      });
    }

    // If no metadata found, create a basic ValueView with an UnknownAssetId
    // Create a placeholder assetId
    const assetId = new AssetId({ inner: new Uint8Array() });

    return toValueView({
      amount: parseInt(balance.amount),
      assetId,
    });
  } catch (error) {
    console.error('Error creating ValueView:', error);
    // Create a fallback ValueView with UnknownAssetId
    const assetId = new AssetId({ inner: new Uint8Array() });
    return toValueView({
      amount: parseInt(balance.amount) || 0,
      assetId,
    });
  }
};
