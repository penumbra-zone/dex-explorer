/* eslint-disable no-bitwise -- expected bitwise operations */
import { describe, expect, it } from 'vitest';
import { FlexibleNumber } from './flexible-number';

describe('FlexibleNumber', () => {
  describe('from string', () => {
    it('should correctly convert from string to number', () => {
      const result = new FlexibleNumber('123').toNumber();

      expect(result).toBe(123);
    });
  });
});
