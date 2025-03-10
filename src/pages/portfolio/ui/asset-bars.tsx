import React from 'react';
import { Card } from '@penumbra-zone/ui/Card';
import { Text } from '@penumbra-zone/ui/Text';
import { BalancesResponse } from '@penumbra-zone/protobuf/penumbra/view/v1/view_pb';
import { Balance } from '@/features/cosmos/types';
import {
  getMetadataFromBalancesResponse,
  getBalanceView,
} from '@penumbra-zone/getters/balances-response';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { formatAmount } from '@penumbra-zone/types/amount';
import { Skeleton } from '@/shared/ui/skeleton';
import { useBalances } from '@/shared/api/balances';
import { useBalances as useCosmosBalances } from '@/features/cosmos/use-augmented-balances';
import { useRegistry } from '@/shared/api/registry';
import { usePenumbraIbcDenoms } from '@/features/penumbra/penumbra-ibc-utils';
import { balanceToValueView } from '@/features/cosmos/utils/balance-to-value-view';
import { Registry } from '@penumbra-labs/registry';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { getStablecoins } from '@/shared/utils/stables';
import { assetPatterns } from '@penumbra-zone/types/assets';

interface AssetAllocation {
  symbol: string;
  percentage: number;
  color: string;
  value: number;
  hasError: boolean;
}

export const AssetBars: React.FC = () => {
  const { data: shieldedBalances, isLoading: isShieldedLoading } = useBalances();
  const { balances: publicBalances, isLoading: isPublicLoading } = useCosmosBalances();
  const { data: registry } = useRegistry();
  const { ibcDenoms: penumbraIbcDenoms = [] } = usePenumbraIbcDenoms();

  const isLoading = isShieldedLoading || isPublicLoading;

  if (isLoading) {
    return <LoadingBars />;
  }

  const hasShieldedBalances = shieldedBalances && shieldedBalances.length > 0;
  const hasPublicBalances = publicBalances.length > 0;

  if (!hasShieldedBalances && !hasPublicBalances) {
    return (
      <Card>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-4'>
            <Text as='h4' large color='text.primary'>
              Allocation
            </Text>
          </div>
          <div className='flex flex-col h-24 justify-center items-center'>
            <Text color='text.secondary'>
              No assets found. Connect your wallets to see your asset allocation.
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  // Calculate values independently regardless of other wallet's state
  const shieldedAllocations = shieldedBalances
    ? calculateShieldedAssetAllocations(shieldedBalances)
    : [];

  const publicAllocations = calculatePublicAssetAllocations(
    publicBalances,
    registry,
    penumbraIbcDenoms,
  );

  // Calculate the max total value to scale the bars
  const shieldedTotal = shieldedAllocations.reduce((acc, { value }) => acc + value, 0);
  const publicTotal = publicAllocations.reduce((acc, { value }) => acc + value, 0);

  // Determine which total is larger for scaling
  const maxTotal = Math.max(shieldedTotal, publicTotal);

  // Calculate the width percentage for each bar - ensure at least minimal width if assets exist
  // TODO: Fix the shielded bar width calculation to properly scale
  const shieldedBarWidth = hasShieldedBalances
    ? maxTotal > 0
      ? (shieldedTotal / maxTotal) * 100
      : shieldedTotal > 0
        ? 100
        : 0
    : 0;

  const publicBarWidth = hasPublicBalances
    ? maxTotal > 0
      ? (publicTotal / maxTotal) * 100
      : publicTotal > 0
        ? 100
        : 0
    : 0;

  // Combine allocations for the legend, prioritizing by value
  const combinedAllocations = [...shieldedAllocations, ...publicAllocations]
    .reduce<AssetAllocation[]>((acc, curr) => {
      const existing = acc.find(item => item.symbol === curr.symbol);
      if (existing) {
        existing.value += curr.value;
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  // Calculate percentages for the combined allocations
  const totalValue = combinedAllocations.reduce((acc, { value }) => acc + value, 0);
  const combinedWithPercentages = combinedAllocations.map(item => ({
    ...item,
    percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
  }));

  // Split into main assets and "Other"
  const mainAssets = combinedWithPercentages.filter(
    asset => asset.percentage >= SMALL_ASSET_THRESHOLD,
  );
  const smallAssets = combinedWithPercentages.filter(
    asset => asset.percentage < SMALL_ASSET_THRESHOLD,
  );

  // Calculate the percentage for "Other"
  const otherPercentage = smallAssets.reduce((acc, asset) => acc + asset.percentage, 0);

  // Final assets for display, including "Other" if applicable
  const displayAssets = [
    ...mainAssets,
    ...(otherPercentage > 0
      ? [
          {
            symbol: 'Other',
            percentage: otherPercentage,
            color: '#71717A', // neutral-500
            value: smallAssets.reduce((acc, { value }) => acc + value, 0),
            hasError: false,
          },
        ]
      : []),
  ];

  // Show loading state if we're fetching with no data
  if (displayAssets.length === 0) {
    return <LoadingBars />;
  }

  return (
    <Card>
      <div className='p-6'>
        <div className='flex justify-between items-center mb-4'>
          <Text as='h4' large color='text.primary'>
            Allocation
          </Text>
        </div>

        <div className='flex flex-col gap-4'>
          {/* Shielded Assets Bar */}
          <div className='flex items-center gap-2'>
            <div className='w-16 text-neutral-400 text-xs font-normal'>Shielded</div>
            <div className='relative h-1.5 flex-grow bg-neutral-800 rounded overflow-hidden'>
              <div
                className='absolute left-0 top-0 h-full'
                style={{ width: `${shieldedBarWidth}%` }}
              >
                {shieldedAllocations.map((allocation, index) => {
                  const prevWidth = shieldedAllocations
                    .slice(0, index)
                    .reduce((acc, item) => acc + (item.percentage / 100) * shieldedBarWidth, 0);

                  // Find the matching asset in displayAssets for consistent color
                  const displayAsset = displayAssets.find(a => a.symbol === allocation.symbol);
                  const barColor = displayAsset?.color ?? allocation.color;

                  return (
                    <div
                      key={`shielded-${allocation.symbol}`}
                      className='absolute top-0 h-full rounded'
                      style={{
                        backgroundColor: barColor,
                        width: `${(allocation.percentage / 100) * shieldedBarWidth}%`,
                        left: `${prevWidth}%`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Public Assets Bar */}
          <div className='flex items-center gap-2'>
            <div className='w-16 text-neutral-400 text-xs font-normal'>Public</div>
            <div className='relative h-1.5 flex-grow bg-neutral-800 rounded overflow-hidden'>
              <div className='absolute left-0 top-0 h-full' style={{ width: `${publicBarWidth}%` }}>
                {publicAllocations.map((allocation, index) => {
                  const prevWidth = publicAllocations
                    .slice(0, index)
                    .reduce((acc, item) => acc + (item.percentage / 100) * publicBarWidth, 0);

                  // Find the matching asset in displayAssets for consistent color
                  const displayAsset = displayAssets.find(a => a.symbol === allocation.symbol);
                  const barColor = displayAsset?.color ?? allocation.color;

                  return (
                    <div
                      key={`public-${allocation.symbol}`}
                      className='absolute top-0 h-full rounded'
                      style={{
                        backgroundColor: barColor,
                        width: `${(allocation.percentage / 100) * publicBarWidth}%`,
                        left: `${prevWidth}%`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Asset Legend */}
          <div className='flex flex-wrap gap-4 pl-[72px] mt-2'>
            {displayAssets.map(asset => (
              <div key={asset.symbol} className='flex items-center gap-1'>
                <div className='w-2 h-2 rounded-full' style={{ backgroundColor: asset.color }} />
                <Text small color='text.primary'>
                  {asset.symbol}
                </Text>
                <Text small color='text.secondary'>
                  {Math.round(asset.percentage)}%
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

/** HSL color saturation for asset bars. Unit: % */
const COLOR_SATURATION = 95;

/** HSL color lightness for asset bars. Unit: % */
const COLOR_LIGHTNESS = 53;

/** Angle used in the golden ratio color distribution algorithm to ensure visually distinct colors. Unit: degrees */
const GOLDEN_RATIO_ANGLE = 137.5;

/** Minimum percentage threshold for an asset to be shown individually. Assets below this are grouped into "Other". Unit: % */
const SMALL_ASSET_THRESHOLD = 2;

const LoadingBars = () => {
  return (
    <Card>
      <div className='p-6'>
        <Text as='h4' large color='text.primary'>
          Allocation
        </Text>

        {/* Asset distribution bar skeleton */}
        <div className='flex flex-col gap-4 mt-4'>
          <div className='flex items-center gap-2'>
            <div className='w-16 text-neutral-400 text-xs'>Shielded</div>
            <div className='w-full h-1.5'>
              <Skeleton />
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='w-16 text-neutral-400 text-xs'>Public</div>
            <div className='w-full h-1.5'>
              <Skeleton />
            </div>
          </div>

          {/* Legend skeleton */}
          <div className='flex flex-wrap gap-4 pl-[72px] mt-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex items-center gap-2'>
                <div className='w-2 h-2'>
                  <Skeleton />
                </div>
                <div className='w-20 h-4'>
                  <Skeleton />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

function calculateShieldedAssetAllocations(balances: BalancesResponse[]): AssetAllocation[] {
  if (balances.length === 0) {
    return [];
  }

  // Filter out NFTs and special assets, but include delegation tokens
  const displayableBalances = balances.filter(balance => {
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    // If we don't have a symbol, we can't display it
    if (!metadata?.symbol) {
      return false;
    }

    // Enhanced filtering for delegation, unbonding, LP NFTs, and auction tokens
    const symbol = metadata.symbol.toLowerCase(); // Convert to lowercase for case-insensitive matching

    // Filter out unwanted asset types with multiple checks for each
    return !(
      // LP NFTs
      (
        symbol.startsWith('lpnft') ||
        // Auction tokens
        symbol.startsWith('auction') ||
        // Delegation tokens - multiple checks
        assetPatterns.delegationToken.matches(metadata.symbol) ||
        symbol.startsWith('delum') ||
        symbol.includes('delegation') ||
        // Unbonding tokens - multiple checks
        symbol.startsWith('unbond') ||
        symbol.includes('unbonding') ||
        // Other special tokens
        symbol.includes('voting') ||
        symbol.includes('vetoken') ||
        symbol.includes('position-id')
      )
    );
  });

  // Calculate values and handle errors
  const valuesWithMetadata = displayableBalances.map((balance, index) => {
    const valueView = getBalanceView.optional(balance);
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    const amount = valueView?.valueView.value?.amount;

    if (!amount || !metadata) {
      return {
        symbol: 'Unknown',
        value: 0,
        color: `hsl(${(index * GOLDEN_RATIO_ANGLE) % 360}, ${COLOR_SATURATION}%, ${COLOR_LIGHTNESS}%)`,
        percentage: 0,
        hasError: true,
      };
    }

    try {
      const displayExponent = getDisplayDenomExponent(metadata);
      const formattedAmount = Number(
        formatAmount({
          amount,
          exponent: displayExponent,
        }),
      );

      if (Number.isNaN(formattedAmount)) {
        throw new Error('Failed to format amount');
      }

      const displaySymbol = metadata.symbol;
      const images = metadata.images;
      const image0 = images.length > 0 ? images[0] : null;
      const theme = image0 ? image0.theme : null;
      const primaryColor = theme ? theme.primaryColorHex : null;

      return {
        symbol: displaySymbol,
        value: formattedAmount,
        color:
          primaryColor ??
          `hsl(${(index * GOLDEN_RATIO_ANGLE) % 360}, ${COLOR_SATURATION}%, ${COLOR_LIGHTNESS}%)`,
        percentage: 0, // Will calculate after summing total
        hasError: false,
      };
    } catch (error) {
      const displaySymbol = metadata.symbol || 'Unknown';
      return {
        symbol: displaySymbol,
        value: 0,
        color: `hsl(${(index * GOLDEN_RATIO_ANGLE) % 360}, ${COLOR_SATURATION}%, ${COLOR_LIGHTNESS}%)`,
        percentage: 0,
        hasError: true,
      };
    }
  });

  // Calculate total value
  const totalValue = valuesWithMetadata.reduce((acc, { value }) => acc + value, 0);

  // Update percentages
  return valuesWithMetadata
    .map(item => ({
      ...item,
      percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function calculatePublicAssetAllocations(
  balances: Balance[],
  registry: Registry | undefined,
  penumbraIbcDenoms: string[] = [],
): AssetAllocation[] {
  if (balances.length === 0) {
    return [];
  }

  // Find USDC metadata for price normalization
  let usdcMetadata: Metadata | undefined;
  if (registry) {
    const allAssets = registry.getAllAssets();
    const { usdc } = getStablecoins(allAssets, 'USDC');
    usdcMetadata = usdc;
  }

  // Group balances by symbol and sum amounts
  const groupedBySymbol = balances.reduce<
    Record<
      string,
      {
        symbol: string;
        amount: number;
        usdcValue: number; // Value normalized to USDC
        denom: string;
        chain: string;
        displaySymbol: string;
        metadata?: Metadata;
      }
    >
  >((acc, balance) => {
    let displaySymbol = balance.symbol;
    let usdcValue = 0;
    let metadata: Metadata | undefined;

    // Use balanceToValueView to convert to Penumbra value (properly accounts for token exponents)
    if (registry) {
      const valueView = balanceToValueView(balance, registry, penumbraIbcDenoms);

      // Extract metadata for display and conversion purposes
      if (valueView.valueView.case === 'knownAssetId') {
        metadata = valueView.valueView.value.metadata;
        if (metadata?.symbol) {
          displaySymbol = metadata.symbol;
        }

        // Get the display exponent to properly scale the value
        let exponent = 0;
        if (metadata && 'denomUnits' in metadata && 'display' in metadata && metadata.display) {
          const displayUnit = metadata.denomUnits.find(
            unit => 'denom' in unit && unit.denom === metadata?.display,
          );
          if (displayUnit && 'exponent' in displayUnit) {
            exponent = displayUnit.exponent;
          }
        }

        // Calculate value accounting for token's exponent
        const amount = parseFloat(balance.amount) || 0;
        const normalizedValue = amount / Math.pow(10, exponent);

        // If we have USDC metadata, convert the value to USDC equivalent
        if (usdcMetadata && metadata) {
          // For USDC itself, the conversion is 1:1
          if (metadata.symbol === 'USDC') {
            usdcValue = normalizedValue;
          } else {
            const estimatedUsdcPrice = 1.0; // Default price estimate (placeholder)
            try {
              usdcValue = normalizedValue * estimatedUsdcPrice;
            } catch (error) {
              usdcValue = normalizedValue; // Fallback to normalized value
            }
          }
        } else {
          // If no USDC metadata, just use the normalized value
          usdcValue = normalizedValue;
        }
      } else {
        // For unknown assets, parse amount directly
        const normalizedValue = parseFloat(balance.amount) || 0;
        // Heuristic: unknown assets with very large amounts are likely small-value tokens
        if (normalizedValue > 1000000) {
          usdcValue = normalizedValue / 1000000;
        } else {
          usdcValue = normalizedValue;
        }
      }
    } else {
      // If registry is not available, use the raw amount but apply normalization heuristic
      const normalizedValue = parseFloat(balance.amount) || 0;
      // Apply normalization heuristic
      if (normalizedValue > 1000000) {
        usdcValue = normalizedValue / 1000000;
      } else {
        usdcValue = normalizedValue;
      }
    }

    // All balances at this point should have a symbol, but just in case use the denom as fallback
    if (!displaySymbol) {
      displaySymbol = balance.denom;
    }

    const symbol = displaySymbol;
    if (!symbol) {
      return acc;
    }

    if (!acc[symbol]) {
      acc[symbol] = {
        symbol,
        displaySymbol,
        amount: 0,
        usdcValue: 0,
        denom: balance.denom,
        chain: balance.chain,
        metadata,
      };
    }

    // Parse and sum raw amounts for reference
    const amount = parseFloat(balance.amount) || 0;
    acc[symbol].amount += amount;
    // Sum USDC values for allocation calculation
    acc[symbol].usdcValue += usdcValue;

    return acc;
  }, {});

  // Convert to array and calculate percentages based on USDC values
  const values = Object.values(groupedBySymbol);
  const totalUsdcValue = values.reduce((acc, { usdcValue }) => acc + usdcValue, 0);

  // Create allocations with colors
  return values
    .map((value, index) => ({
      symbol: value.symbol,
      // Use USDC value for the allocation
      value: value.usdcValue,
      color: `hsl(${(index * GOLDEN_RATIO_ANGLE) % 360}, ${COLOR_SATURATION}%, ${COLOR_LIGHTNESS}%)`,
      percentage: totalUsdcValue > 0 ? (value.usdcValue / totalUsdcValue) * 100 : 0,
      hasError: false,
    }))
    .sort((a, b) => b.value - a.value);
}
