import { Trace } from '@/shared/api/server/book/types.ts';

/* TODO: write tests for this*/
export const calculateSpread = (sellOrders: Trace[], buyOrders: Trace[]) => {
  if (!sellOrders.length || !buyOrders.length) {
    return;
  }

  const lowestSell = sellOrders[sellOrders.length - 1];
  const highestBuy = buyOrders[0];

  if (lowestSell === undefined || highestBuy === undefined) {
    return;
  }

  const sellPrice = parseFloat(lowestSell.price);
  const buyPrice = parseFloat(highestBuy.price);

  const spread = sellPrice - buyPrice;
  const midPrice = (sellPrice + buyPrice) / 2;
  const spreadPercentage = (spread / midPrice) * 100;

  return {
    amount: spread.toFixed(8),
    percentage: spreadPercentage.toFixed(2),
    midPrice: midPrice.toFixed(8),
  };
};
