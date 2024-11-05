export type CandleApiResponse = Candle[] | { error: string };

export interface Candle {
  close: number;
  direct_volume: number;
  high: number;
  low: number;
  open: number;
  swap_volume: number;
  start_time: Date;
}
