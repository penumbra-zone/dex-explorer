export interface OrderBookHeaderProps {
  base: string;
  quote: string;
}

export const RouteBookHeader = ({ base, quote }: OrderBookHeaderProps) => {
  return (
    <div className='grid grid-cols-subgrid col-span-4 text-xs text-gray-400 px-4 border-b border-b-other-tonalStroke'>
      <div className='py-2 font-normal text-left'>Price({quote})</div>
      <div className='py-2 font-normal text-right'>Amount({base})</div>
      <div className='py-2 font-normal text-right'>Total</div>
      <div className='py-2 font-normal text-right'>Route</div>
    </div>
  );
};
