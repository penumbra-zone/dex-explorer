import { OhlcData, UTCTimestamp } from 'lightweight-charts';

export type CandleApiResponse = OhlcData[] | { error: string };

interface DbCandle {
  close: number;
  direct_volume: number;
  high: number;
  low: number;
  open: number;
  swap_volume: number;
  start_time: Date;
}

export const dbCandleToOhlc = (c: DbCandle): OhlcData => {
  return {
    close: c.close,
    high: c.high,
    low: c.low,
    open: c.open,
    time: (c.start_time.getTime() / 1000) as UTCTimestamp,
  };
};
