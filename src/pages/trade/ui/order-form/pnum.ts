import BigNumber from 'bignumber.js';
import { round } from '@penumbra-zone/types/round';
import { LoHi, joinLoHi, splitLoHi } from '@penumbra-zone/types/lo-hi';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { ValueView } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { getAmount, getDisplayDenomExponentFromValueView } from '@penumbra-zone/getters/value-view';
import { removeTrailingZeros } from '@penumbra-zone/types/shortify';

/**
 * pnum (penumbra number)
 *
 * In Penumbra a number can be in the form of a base unit (bigint, LoHi, Amount, ValueView)
 * or a number in decimals for display purposes (string, number)
 *
 * This constructor handles all these cases and automatically converts them to a BigNumber
 * - when the input is a bigint, LoHi, Amount, or ValueView, it is assumed to be in base units
 * - when the input is a string or number, it is multiplied by 10^exponent and converted to base units
 *
 * Likewise for all methods, the outputs are
 * - in base units for bigint, LoHi, Amount and ValueView
 * - in display form with decimals for string and number
 *
 * @param input
 * @param exponent
 */
function pnum(
  input: string | number | LoHi | bigint | Amount | ValueView | undefined,
  exponentInput = 0,
) {
  let value: BigNumber;
  let exponent = exponentInput;

  if (typeof input === 'string' || typeof input === 'number') {
    value = new BigNumber(input).shiftedBy(exponent);
  } else if (typeof input === 'bigint') {
    value = new BigNumber(input.toString());
  } else if (input instanceof ValueView) {
    const amount = getAmount(input);
    value = new BigNumber(joinLoHi(amount.lo, amount.hi).toString());
    exponent =
      input.valueView.case === 'knownAssetId' ? getDisplayDenomExponentFromValueView(input) : 0;
  } else if (
    input instanceof Amount ||
    (typeof input === 'object' && 'lo' in input && 'hi' in input && input.lo && input.hi)
  ) {
    value = new BigNumber(joinLoHi(input.lo, input.hi).toString());
  } else {
    value = new BigNumber(0);
  }

  return {
    toBigInt(): bigint {
      return BigInt(value.toString());
    },

    toBigNumber(): BigNumber {
      return value;
    },

    toString(): string {
      return value.shiftedBy(-exponent).toString();
    },

    toRoundedString(): string {
      return round({ value: value.shiftedBy(-exponent).toNumber(), decimals: exponent });
    },

    toFormattedString(commas = true): string {
      return value.shiftedBy(-exponent).toFormat(exponent, {
        decimalSeparator: '.',
        groupSeparator: commas ? ',' : '',
        groupSize: 3,
      });
    },

    toNumber(): number {
      const number = value.shiftedBy(-exponent).toNumber();
      if (!Number.isFinite(number)) {
        throw new Error('Number exceeds JavaScript numeric limits, convert to other type instead.');
      }
      return number;
    },

    toRoundedNumber(): number {
      return Number(round({ value: value.shiftedBy(-exponent).toNumber(), decimals: exponent }));
    },

    toFormattedNumber(commas = true): number {
      const number = value.shiftedBy(-exponent).toFormat(exponent, {
        decimalSeparator: '.',
        groupSeparator: commas ? ',' : '',
        groupSize: 3,
      });
      return Number(removeTrailingZeros(number));
    },

    toLoHi(): LoHi {
      return splitLoHi(BigInt(value.toString()));
    },

    toAmount(): Amount {
      return new Amount(splitLoHi(BigInt(value.toString())));
    },
  };
}

export { pnum };