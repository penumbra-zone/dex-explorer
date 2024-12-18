import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { SummaryData } from '../api/server/summary/types';

/**
 * Calculates the display price based on the base price and display exponents.
 */
export const calculateDisplayPrice = (
  baseCalculatedPrice: number,
  baseMetadata: Metadata,
  quoteMetadata: Metadata,
): number => {
  const baseExponent = getDisplayDenomExponent(baseMetadata);
  const quoteExponent = getDisplayDenomExponent(quoteMetadata);

  const exponentDifference = quoteExponent - baseExponent;

  if (exponentDifference >= 0) {
    const multiplier = Math.pow(10, -exponentDifference);
    return baseCalculatedPrice * multiplier;
  } else {
    const divisor = Math.pow(10, exponentDifference);
    return baseCalculatedPrice / divisor;
  }
};

/**
 * Collect the quote assets from all trading pairs.
 */
export const collectQuoteAssets = (summaryData: SummaryData[][]): string[] => {
  let quoteAssetsList: string[] = [];
  if (summaryData) {
    summaryData.forEach(page => {
      page.forEach(item => {
        const quoteAsset = item.quoteAsset.symbol;
        quoteAssetsList.push(quoteAsset);
      });
    });
  }

  return quoteAssetsList;
};

/**
 * Calculates USDC-normalized amounts for trading pair values (volume or liquidity)
 */
export const calculateScaledAmount = (
  item: SummaryData, // trading pair data to normalize
  usdcPrice: SummaryData, // USDC price data for the quote asset
  type: 'directVolume' | 'liquidity',
  results: bigint[],
  index: number,
) => {
  if (item && type in item) {
    // Scale the USDC price by the quote asset's decimal places.
    const scaledPrice = Math.floor(
      usdcPrice.price * 100 ** getDisplayDenomExponent(usdcPrice.quoteAsset),
    );

    // Multiply the original amount (volume or liquidity) by the scaled USDC price.
    const result = item[type].valueView.value?.amount?.lo! * BigInt(scaledPrice);

    // Divide by scaling factor to get the final USDC-denominated value.
    results[index] = result / BigInt(100 ** getDisplayDenomExponent(usdcPrice.quoteAsset));
  }
};
