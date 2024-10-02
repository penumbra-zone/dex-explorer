import { useRef, useEffect } from 'react';
import { createChart, IChartApi, CandlestickData } from 'lightweight-charts';
import { tailwindConfig } from '@penumbra-zone/ui/tailwind';
import { useCandles } from './useCandles';

const { colors } = tailwindConfig.theme.extend;

interface ChartProps {
  height: number;
}

export function Chart({ height }: ChartProps) {
  const chartElRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candles = useCandles();

  useEffect(() => {
    if (chartElRef.current && !chartRef.current) {
      chartRef.current = createChart(chartElRef.current, {
        autoSize: true,
        layout: {
          textColor: colors.text.primary,
          background: {
            color: 'transparent',
          },
        },
        grid: {
          vertLines: {
            color: colors.other.tonalStroke,
          },
          horzLines: {
            color: colors.other.tonalStroke,
          },
        },
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartElRef]);

  useEffect(() => {
    if (chartRef.current && !candles.loading) {
      chartRef.current
        .addCandlestickSeries({
          upColor: colors.success.light,
          downColor: colors.destructive.light,
          borderVisible: false,
          wickUpColor: colors.success.light,
          wickDownColor: colors.destructive.light,
        })
        .setData(candles.data as unknown[] as CandlestickData[]);

      chartRef.current.timeScale().fitContent();
    }
  }, [chartRef, candles.loading, candles.data]);

  return <div ref={chartElRef} style={{ height }} />;
}
