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

interface AssetAllocation {
  symbol: string;
  percentage: number;
  color: string;
  value: number;
  hasError: boolean;
}

interface AssetBarsProps {
  // No props needed now that hooks are internal
}

/** HSL color saturation for asset bars. Unit: % */
const COLOR_SATURATION = 95;

/** HSL color lightness for asset bars. Unit: % */
const COLOR_LIGHTNESS = 53;

/** Angle used in the golden ratio color distribution algorithm to ensure visually distinct colors. Unit: degrees */
const GOLDEN_RATIO_ANGLE = 137.5;

/** Minimum percentage threshold for an asset to be shown individually. Assets below this are grouped into "Other". Unit: % */
const SMALL_ASSET_THRESHOLD = 2;

export const AssetBars: React.FC<AssetBarsProps> = () => {
  // Move the hooks inside the component
  const { data: shieldedBalances, isLoading: isShieldedLoading } = useBalances();
  const { balances: publicBalances, isLoading: isPublicLoading } = useCosmosBalances();

  const isLoading = isShieldedLoading || isPublicLoading;

  if (isLoading) {
    return <LoadingBars />;
  }

  // Calculate values for shielded assets
  const shieldedAllocations = calculateShieldedAssetAllocations(shieldedBalances ?? []);

  // Calculate values for public assets
  const publicAllocations = calculatePublicAssetAllocations(publicBalances);

  // Calculate the max total value to scale the bars
  const shieldedTotal = shieldedAllocations.reduce((acc, { value }) => acc + value, 0);
  const publicTotal = publicAllocations.reduce((acc, { value }) => acc + value, 0);

  // Determine which total is larger for scaling
  const maxTotal = Math.max(shieldedTotal, publicTotal);

  // Calculate the width percentage for each bar
  const shieldedBarWidth = maxTotal > 0 ? (shieldedTotal / maxTotal) * 100 : 0;
  const publicBarWidth = maxTotal > 0 ? (publicTotal / maxTotal) * 100 : 0;

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

                  return (
                    <div
                      key={`shielded-${allocation.symbol}`}
                      className='absolute top-0 h-full rounded'
                      style={{
                        backgroundColor: allocation.color,
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

                  return (
                    <div
                      key={`public-${allocation.symbol}`}
                      className='absolute top-0 h-full rounded'
                      style={{
                        backgroundColor: allocation.color,
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
                <Text small>{asset.symbol}</Text>
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

// Helper function to calculate asset allocations from Penumbra balances
function calculateShieldedAssetAllocations(balances: BalancesResponse[]): AssetAllocation[] {
  if (balances.length === 0) {
    return [];
  }

  // Filter out NFTs and special assets
  const displayableBalances = balances.filter(balance => {
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    // If we don't have a symbol, we can't display it
    if (!metadata?.symbol) {
      return false;
    }

    // Filter out LP NFTs, unbonding tokens, and auction tokens
    return (
      !metadata.symbol.startsWith('lpNft') &&
      !metadata.symbol.startsWith('unbond') &&
      !metadata.symbol.startsWith('auction')
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
      const formattedAmount = Number(
        formatAmount({
          amount,
          exponent: getDisplayDenomExponent(metadata),
        }),
      );

      if (Number.isNaN(formattedAmount)) {
        throw new Error('Failed to format amount');
      }

      // Fix the optional chaining
      const primaryColor =
        metadata.images &&
        metadata.images[0] &&
        metadata.images[0].theme &&
        metadata.images[0].theme.primaryColorHex;
      return {
        symbol: metadata.symbol,
        value: formattedAmount,
        color:
          primaryColor ??
          `hsl(${(index * GOLDEN_RATIO_ANGLE) % 360}, ${COLOR_SATURATION}%, ${COLOR_LIGHTNESS}%)`,
        percentage: 0, // Will calculate after summing total
        hasError: false,
      };
    } catch (error) {
      return {
        symbol: metadata.symbol || 'Unknown',
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

// Helper function to calculate asset allocations from Cosmos balances
function calculatePublicAssetAllocations(balances: Balance[]): AssetAllocation[] {
  if (balances.length === 0) {
    return [];
  }

  // Group balances by symbol and sum amounts
  const groupedBySymbol = balances.reduce<
    Record<string, { symbol: string; amount: number; denom: string; chain: string }>
  >((acc, balance) => {
    const symbol = balance.symbol || balance.denom;
    if (!symbol) {
      return acc;
    }

    if (!acc[symbol]) {
      acc[symbol] = {
        symbol,
        amount: 0,
        denom: balance.denom,
        chain: balance.chain,
      };
    }

    // Parse and sum amounts
    const amount = parseFloat(balance.amount) || 0;
    acc[symbol].amount += amount;

    return acc;
  }, {});

  // Convert to array and calculate percentages
  const values = Object.values(groupedBySymbol);
  const totalValue = values.reduce((acc, { amount }) => acc + amount, 0);

  // Create allocations with colors
  return values
    .map((value, index) => ({
      symbol: value.symbol,
      value: value.amount,
      color: `hsl(${(index * GOLDEN_RATIO_ANGLE) % 360}, ${COLOR_SATURATION}%, ${COLOR_LIGHTNESS}%)`,
      percentage: totalValue > 0 ? (value.amount / totalValue) * 100 : 0,
      hasError: false,
    }))
    .sort((a, b) => b.value - a.value);
}
