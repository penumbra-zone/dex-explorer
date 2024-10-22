import { useRef, useEffect } from 'react';
import { createChart, IChartApi, CandlestickData } from 'lightweight-charts';
import { tailwindConfig } from '@penumbra-zone/ui/tailwind';
import { useCandles } from '@/fetchers/candles';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';

const { colors } = tailwindConfig.theme.extend;

interface ChartProps {
  height: number;
  primary: Metadata;
  numeraire: Metadata;
}

export function Chart({ height, primary, numeraire }: ChartProps) {
  const chartElRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { data: candles, isLoading } = useCandles(primary.symbol, numeraire.symbol, 0, 10000);

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
    if (chartRef.current && !isLoading) {
      chartRef.current
        .addCandlestickSeries({
          upColor: colors.success.light,
          downColor: colors.destructive.light,
          borderVisible: false,
          wickUpColor: colors.success.light,
          wickDownColor: colors.destructive.light,
        })
        .setData(candles as unknown[] as CandlestickData[]);

      chartRef.current.timeScale().fitContent();
    }
  }, [chartRef, isLoading, candles]);

  return (
    <div ref={chartElRef} style={{ height }}>
      {isLoading && (
        <div className='flex w-full items-center justify-center' style={{ height }}>
          <div className='text-gray-500'>Loading...</div>
        </div>
      )}
    </div>
  );
}
