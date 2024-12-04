import { describe, it, expect } from 'vitest';
import { DurationWindow } from '@/shared/utils/duration.ts';
import { OhlcData, UTCTimestamp } from 'lightweight-charts';
import { insertEmptyCandles } from '@/shared/api/server/candles/utils.ts';

// insertEmptyCandles.test.ts (continued)

describe('insertEmptyCandles', () => {
  const window: DurationWindow = '1m'; // 1 minute window

  it('should return empty array when input data is empty', () => {
    const input: OhlcData<UTCTimestamp>[] = [];
    const output = insertEmptyCandles(window, input);
    expect(output).toEqual([]);
  });

  // it('should return the same candle when there is only one candle', () => {
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200 as UTCTimestamp, open: 100, high: 105, low: 95, close: 102 },
  //   ];
  //   const output = insertEmptyCandles(window, input);
  //   expect(output).toEqual(input);
  // });
  //
  // it('should return the same candles when there are no gaps', () => {
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200 as UTCTimestamp, open: 100, high: 105, low: 95, close: 102 },
  //     { time: 1609459260 as UTCTimestamp, open: 102, high: 106, low: 101, close: 104 },
  //     { time: 1609459320 as UTCTimestamp, open: 104, high: 107, low: 103, close: 105 },
  //   ];
  //   const output = insertEmptyCandles(window, input);
  //   expect(output).toEqual(input);
  // });
  //
  // it('should insert empty candles when there are gaps', () => {
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 },
  //     // Gap of 2 minutes
  //     { time: 1609459320, open: 104, high: 107, low: 103, close: 105 },
  //   ];
  //   const expectedOutput: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 },
  //     // Inserted empty candle at 1609459260
  //     { time: 1609459260, open: 102, high: 102, low: 102, close: 102 },
  //     { time: 1609459320, open: 104, high: 107, low: 103, close: 105 },
  //   ];
  //   const output = insertEmptyCandles(window, input);
  //   expect(output).toEqual(expectedOutput);
  // });
  //
  // it('should insert multiple empty candles when multiple gaps exist', () => {
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 },
  //     // Gap of 3 minutes
  //     { time: 1609459380, open: 106, high: 110, low: 105, close: 108 },
  //   ];
  //   const expectedOutput: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 },
  //     { time: 1609459260, open: 102, high: 102, low: 102, close: 102 },
  //     { time: 1609459320, open: 102, high: 102, low: 102, close: 102 },
  //     { time: 1609459380, open: 106, high: 110, low: 105, close: 108 },
  //   ];
  //   const output = insertEmptyCandles(window, input);
  //   expect(output).toEqual(expectedOutput);
  // });
  //
  // it('should not insert candles if nextTime is not less than candle.time', () => {
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 },
  //     // nextTime after addDurationWindow would be 1609459260
  //     { time: 1609459260, open: 102, high: 106, low: 101, close: 104 },
  //     // No gap here
  //     { time: 1609459320, open: 104, high: 107, low: 103, close: 105 },
  //   ];
  //   const output = insertEmptyCandles(window, input);
  //   expect(output).toEqual(input);
  // });
  //
  // it('should handle multiple insertions and existing candles correctly', () => {
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 }, // 00:00
  //     { time: 1609459320, open: 104, high: 107, low: 103, close: 105 }, // 00:02
  //     { time: 1609459440, open: 105, high: 108, low: 104, close: 107 }, // 00:04
  //   ];
  //   const expectedOutput: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 }, // 00:00
  //     { time: 1609459260, open: 102, high: 102, low: 102, close: 102 }, // 00:01
  //     { time: 1609459320, open: 104, high: 107, low: 103, close: 105 }, // 00:02
  //     { time: 1609459380, open: 105, high: 105, low: 105, close: 105 }, // 00:03
  //     { time: 1609459440, open: 105, high: 108, low: 104, close: 107 }, // 00:04
  //   ];
  //   const output = insertEmptyCandles(window, input);
  //   expect(output).toEqual(expectedOutput);
  // });
  //
  // it('should throw an error if previous candle is undefined', () => {
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     // Intentionally undefined previous candle
  //     // This scenario is hard to reproduce with the current logic,
  //     // but we'll simulate it by manipulating the output array directly.
  //   ];
  //
  //   // Since the function throws an error when `prev` is undefined,
  //   // which can only happen if `out` is empty or has undefined,
  //   // and the function already checks `if (out.length > 0)` before accessing `prev`,
  //   // it's unlikely to reach the error. Therefore, this test might not be necessary.
  //   // However, if you have scenarios where `out` can have undefined, you can test it here.
  //   expect(true).toBe(true); // Placeholder
  // });
  //
  // it('should handle different duration windows correctly', () => {
  //   const shortWindow: DurationWindow = '2m'; // 2 minutes window
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 }, // 00:00
  //     { time: 1609459320, open: 104, high: 107, low: 103, close: 105 }, // 00:02
  //     { time: 1609459440, open: 105, high: 108, low: 104, close: 107 }, // 00:04
  //   ];
  //   const expectedOutput: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 }, // 00:00
  //     { time: 1609459320, open: 104, high: 107, low: 103, close: 105 }, // 00:02
  //     { time: 1609459440, open: 105, high: 108, low: 104, close: 107 }, // 00:04
  //   ];
  //   const output = insertEmptyCandles(shortWindow, input);
  //   expect(output).toEqual(input);
  // });
  //
  // it('should insert empty candles correctly with larger duration windows', () => {
  //   const largerWindow: DurationWindow = '3m'; // 3 minutes window
  //   const input: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 }, // 00:00
  //     { time: 1609459380, open: 106, high: 110, low: 105, close: 108 }, // 00:03
  //     { time: 1609459560, open: 108, high: 112, low: 107, close: 110 }, // 00:06
  //   ];
  //   const expectedOutput: OhlcData<UTCTimestamp>[] = [
  //     { time: 1609459200, open: 100, high: 105, low: 95, close: 102 }, // 00:00
  //     { time: 1609459380, open: 106, high: 110, low: 105, close: 108 }, // 00:03
  //     { time: 1609459560, open: 108, high: 112, low: 107, close: 110 }, // 00:06
  //   ];
  //   const output = insertEmptyCandles(largerWindow, input);
  //   expect(output).toEqual(input);
  // });
});
