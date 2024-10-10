import lodashRound from 'lodash/round';

/**
 * Replacement for toFixed()
 *
 * toFixed falsely rounds the number:
 * > 1.0005.toFixed(3)
 * 1.000 // instead of 1.001
 */
export function round(value: number, n: number, toFixed = true): number | string {
  const roundedNo = lodashRound(value, n);

  if (toFixed) {
    return roundedNo.toFixed(n);
  }
  return roundedNo;
}
