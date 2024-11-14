/**
 * Makes large numbers shorter. Examples:
 * - 999 -> 999
 * - 1000 -> 1K
 * - 1000000 -> 1M
 * - 1000000000 -> 1B
 */
export const shortify = (value: number): string => {
  if (value < 1000) {
    return Number(value).toFixed(0);
  }

  if (value < 1000000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  if (value < 1000000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  return `${(value / 1000000000).toFixed(1)}B`;
};
