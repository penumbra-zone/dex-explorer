import { useEffect, useRef } from 'react';
import { CandlestickData, createChart, IChartApi } from 'lightweight-charts';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { tailwindConfig } from '@penumbra-zone/ui/tailwind';
import { usePathToMetadata } from '../model/use-path-to-metadata';
import { useCandles } from '../api/candles';
import { observer } from 'mobx-react-lite';

const { colors } = tailwindConfig.theme.extend;

interface ChartProps {
  height: number;
}

const ChartLoadingState = ({ height }: ChartProps) => {
  return (
    <div style={{ height }}>
      <div className='flex w-full items-center justify-center' style={{ height }}>
        <div className='text-gray-500'>Loading...</div>
      </div>
    </div>
  );
};

const ChartData = observer(
  ({
    height,
    baseAsset,
    quoteAsset,
  }: {
    height: number;
    baseAsset: Metadata;
    quoteAsset: Metadata;
  }) => {
    const chartElRef = useRef<HTMLInputElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

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
      if (chartRef.current && !isLoading && candles) {
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
        {error && (
          <div className='flex w-full items-center justify-center' style={{ height }}>
            <div className='text-red-600'>{String(error)}</div>
          </div>
        )}
      </div>
    );
  },
);

export const Chart = observer(({ height }: ChartProps) => {
  const { data, isLoading, error } = useCandles();

  if (isLoading) {
    return <ChartLoadingState height={height} />;
  }

  if (error) {
    return <div className='text-white'>Error loading pair selector: ${String(error)}</div>;
  }

  console.log(data);
  return <div className='text-white'>Loaded</div>;

  // return <ChartData height={height} baseAsset={baseAsset} quoteAsset={quoteAsset} />;
});
