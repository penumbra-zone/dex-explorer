import { useRef, useEffect } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { tailwindConfig } from '@penumbra-zone/ui/tailwind';
import { useBlockInfo } from '../../../../fetchers/block';

const { colors } = tailwindConfig.theme.extend;

interface ChartProps {
  height: number;
}

export function Chart({ height }: ChartProps) {
  const chartElRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<IChartApi>(null);

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

      const candlestickSeries = chartRef.current.addCandlestickSeries({
        upColor: colors.success.light,
        downColor: colors.destructive.light,
        borderVisible: false,
        wickUpColor: colors.success.light,
        wickDownColor: colors.destructive.light,
      });

      const data = [
        { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
        { open: 9.55, high: 10.3, low: 9.42, close: 9.94, time: 1642514276 },
        { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 },
        { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 },
        { open: 9.51, high: 10.46, low: 9.1, close: 10.17, time: 1642773476 },
        { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 },
        { open: 10.47, high: 11.39, low: 10.4, close: 10.81, time: 1642946276 },
        { open: 10.81, high: 11.6, low: 10.3, close: 10.75, time: 1643032676 },
        { open: 10.75, high: 11.6, low: 10.49, close: 10.93, time: 1643119076 },
        { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 },
      ];

      candlestickSeries.setData(data);

      chartRef.current.timeScale().fitContent();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartElRef]);

  return <div ref={chartElRef} style={{ height }} />;
}
