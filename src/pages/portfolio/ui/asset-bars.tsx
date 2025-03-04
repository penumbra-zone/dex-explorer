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

  console.debug('=== SHIELDED BALANCES DIAGNOSTIC ===');
  console.debug('Shielded Balances Count:', shieldedBalances?.length ?? 0);
  console.debug('Public Balances Count:', publicBalances.length);

  if (isLoading) {
    return <LoadingBars />;
  }

  // If no data is available yet but we're not loading, show a minimal placeholder
  const hasShieldedBalances = shieldedBalances && shieldedBalances.length > 0;
  const hasPublicBalances = publicBalances.length > 0;

  console.debug('Has Shielded Balances:', hasShieldedBalances);
  console.debug('Has Public Balances:', hasPublicBalances);

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

  console.debug('Shielded Balances:', shieldedBalances);
  console.debug('Public Balances:', publicBalances);
  // IMPORTANT: Calculate values independently regardless of other wallet's state
  // Calculate values for shielded assets - always provide an array even if null/undefined
  const shieldedAllocations = shieldedBalances
    ? calculateShieldedAssetAllocations(shieldedBalances)
    : [];
  console.debug('Calculated shielded allocations:', shieldedAllocations.length, 'assets');
  console.debug(
    'Shielded Allocations Detail:',
    shieldedAllocations.map(a => a.symbol),
  );

  // Calculate values for public assets
  const publicAllocations = calculatePublicAssetAllocations(
    publicBalances,
    registry,
    penumbraIbcDenoms,
  );
  console.debug('Calculated public allocations:', publicAllocations.length, 'assets');
  console.debug(
    'Public Allocations Detail:',
    publicAllocations.map(a => a.symbol),
  );

  // Calculate the max total value to scale the bars
  const shieldedTotal = shieldedAllocations.reduce((acc, { value }) => acc + value, 0);
  const publicTotal = publicAllocations.reduce((acc, { value }) => acc + value, 0);

  console.debug('Shielded Total:', shieldedTotal);
  console.debug('Public Total:', publicTotal);

  // Determine which total is larger for scaling
  const maxTotal = Math.max(shieldedTotal, publicTotal);

  // Calculate the width percentage for each bar - ensure at least minimal width if assets exist
  // TODO: fix the way the public bar width is calculated
  const shieldedBarWidth = 100; /* hasShieldedBalances
    ? maxTotal > 0
      ? (shieldedTotal / maxTotal) * 100
      : shieldedTotal > 0
        ? 100
        : 0
    : 0; */

  const publicBarWidth = hasPublicBalances
    ? maxTotal > 0
      ? (publicTotal / maxTotal) * 100
      : publicTotal > 0
        ? 100
        : 0
    : 0;

  console.debug('Shielded Bar Width:', shieldedBarWidth);
  console.debug('Public Bar Width:', publicBarWidth);

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

// Help function to calculate asset allocation from Penumbra balances
function calculateShieldedAssetAllocations(balances: BalancesResponse[]): AssetAllocation[] {
  console.debug('=== CALCULATE SHIELDED ALLOCATIONS ===');
  console.debug('Input balances count:', balances.length);

  if (balances.length === 0) {
    console.debug('No shielded balances to display');
    return [];
  }

  // Filter out NFTs and special assets, but INCLUDE delegation tokens
  const displayableBalances = balances.filter(balance => {
    const metadata = getMetadataFromBalancesResponse.optional(balance);

    // If we don't have a symbol, we can't display it
    if (!metadata?.symbol) {
      console.debug('Filtering out balance with no symbol');
      return false;
    }

    // IMPORTANT: Make sure to include delegation tokens!
    // Include everything except LP NFTs and auction tokens
    const isLpNft = metadata.symbol.startsWith('lpNft');
    const isAuctionToken = metadata.symbol.startsWith('auction');
    const shouldInclude = !isLpNft && !isAuctionToken;

    // Log specifically for delegation tokens
    if (metadata.symbol.includes('unbond')) {
      console.debug(`Found delegation token: ${metadata.symbol}, including: ${shouldInclude}`);
    }

    console.debug(`Balance ${metadata.symbol}: ${shouldInclude ? 'including' : 'excluding'}`);
    return shouldInclude;
  });

  console.debug('Displayable balances count:', displayableBalances.length);
  console.debug(
    'Displayable balances symbols:',
    displayableBalances.map(b => getMetadataFromBalancesResponse.optional(b)?.symbol),
  );

  // Calculate values and handle errors
  const valuesWithMetadata = displayableBalances.map((balance, index) => {
    const valueView = getBalanceView.optional(balance);
    const metadata = getMetadataFromBalancesResponse.optional(balance);
    const amount = valueView?.valueView.value?.amount;

    console.debug(`Processing balance ${metadata?.symbol}:`, {
      hasMetadata: !!metadata,
      hasValueView: !!valueView,
      valueViewCase: valueView?.valueView.case,
      hasAmount: !!amount,
      amountValue: amount?.toString(),
    });

    if (!amount || !metadata) {
      console.debug('Missing amount or metadata for balance');
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

      console.debug(`Formatting amount for ${metadata.symbol}:`, {
        rawAmount: String(amount),
        displayExponent: displayExponent,
      });

      const formattedAmount = Number(
        formatAmount({
          amount,
          exponent: displayExponent,
        }),
      );

      console.debug(
        `Formatted amount for ${metadata.symbol}: ${formattedAmount} (exponent: ${displayExponent})`,
      );

      if (Number.isNaN(formattedAmount)) {
        console.warn(`Failed to format amount for ${metadata.symbol}`);
        throw new Error('Failed to format amount');
      }

      // All assets at this point should have a proper symbol
      const displaySymbol = metadata.symbol;

      // Using if-checks instead of optional chaining for cleaner code
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
      // Use the symbol from metadata or fall back to Unknown
      const displaySymbol = metadata.symbol || 'Unknown';
      console.warn(`Error processing ${displaySymbol}:`, error);

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
  console.debug('Total shielded value:', totalValue);
  console.debug(
    'Individual asset values:',
    valuesWithMetadata.map(item => ({ symbol: item.symbol, value: item.value })),
  );

  // Update percentages
  const result = valuesWithMetadata
    .map(item => ({
      ...item,
      percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  console.debug(
    'Final shielded allocations:',
    result.map(r => ({
      symbol: r.symbol,
      value: r.value,
      percentage: r.percentage,
    })),
  );

  return result;
}

// Helper function to calculate asset allocations from Cosmos balances
function calculatePublicAssetAllocations(
  balances: Balance[],
  registry: Registry | undefined,
  penumbraIbcDenoms: string[] = [],
): AssetAllocation[] {
  if (balances.length === 0) {
    return [];
  }

  // Group balances by symbol and sum amounts
  const groupedBySymbol = balances.reduce<
    Record<
      string,
      { symbol: string; amount: number; denom: string; chain: string; displaySymbol: string }
    >
  >((acc, balance) => {
    // Extract a display symbol for the asset
    // If we have a symbol from decodeBalance, use it
    // Otherwise, try to create a more readable version based on chain and denom
    let displaySymbol = balance.symbol;

    // If registry is available, try to get a better name using balanceToValueView
    if (registry && !displaySymbol && balance.denom.startsWith('ibc/')) {
      const valueView = balanceToValueView(balance, registry, penumbraIbcDenoms);
      if (valueView.valueView.case === 'knownAssetId') {
        const metadata = valueView.valueView.value.metadata;
        if (metadata?.symbol) {
          displaySymbol = metadata.symbol;
        }
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
