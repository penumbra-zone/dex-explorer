import { adaptData, PreviewChartProps } from './adapter';

export type { PreviewChartProps };

export const PreviewChart = (props: PreviewChartProps) => {
  const data = adaptData(props);

  // Get min and max values for chart bounds
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue;

  // Function to calculate percentage height
  const calculateHeightPercentage = (value: number) =>
    valueRange === 0 ? 50 : ((value - minValue) / valueRange) * 100;

  return (
    <div className="flex items-end h-12 w-12">
      {data.map((point, index) => (
        <div
          key={index}
          className="flex flex-col justify-start items-center w-full h-full"
          style={{
            height: `${calculateHeightPercentage(point.value)}%`,
          }}
        >
          <div className="bg-blue-500 w-[2px] h-[2px]" />
        </div>
      ))}
    </div>
  );
};
