import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import {
  Position,
  PositionId,
  PositionState_PositionStateEnum,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { round } from '@/shared/utils/round';
import { useComputePositionId } from '@/shared/utils/useComputePositionId';
import { usePathToMetadata } from '../model/use-path-to-metadata';
import { useBook } from '../api/book';
import { observer } from 'mobx-react-lite';
import { fromBaseUnit } from '@penumbra-zone/types/lo-hi';
import { bech32mPositionId } from '@penumbra-zone/bech32m/plpid';
import { RouteBookResponse } from '@/shared/api/server/booktwo.ts';

interface Route {
  lpId: string;
  position: Position;
  price: number;
  amount: number;
}

interface RouteWithTotal extends Route {
  total: number;
}

/**
 * This function loops over the route data and combines the routes with the same price
 * and counts the total from the route’s amount
 */
function getTotals(data: Route[], isBuySide: boolean, limit: number): RouteWithTotal[] {
  const totals = new Map<number, RouteWithTotal>();

  data.forEach((route: Route) => {
    const entry = totals.get(route.price);
    if (entry) {
      totals.set(route.price, {
        ...route,
        total: entry.total + route.amount,
        amount: Math.min(entry.amount, route.amount),
      });
    } else {
      totals.set(route.price, {
        ...route,
        total: route.amount,
      });
    }
  });

  return isBuySide
    ? Array.from(totals.values())
        .slice(0, limit)
        .toSorted((a, b) => b.price - a.price)
    : Array.from(totals.values()).slice(-limit);
}

function getDisplayData({
  data,
  computePositionId,
  asset1,
  asset2,
  isBuySide,
  limit,
}: {
  data: Position[];
  computePositionId: ((position: Position) => PositionId) | undefined;
  asset1: Metadata | undefined;
  asset2: Metadata | undefined;
  isBuySide: boolean;
  limit: number;
}): RouteWithTotal[] {
  if (!computePositionId || !asset1 || !asset2) {
    return [];
  }

  const asset1Exponent = getDisplayDenomExponent(asset1);
  const asset2Exponent = getDisplayDenomExponent(asset2);

  const getValue = (property: Amount | undefined, exponent: number) =>
    fromBaseUnit(BigInt(property?.lo ?? 0), BigInt(property?.hi ?? 0), exponent);

  const routes = data
    .filter(position => position.state?.state === PositionState_PositionStateEnum.OPENED)
    .map(position => {
      const direction = position.phi?.pair?.asset2?.equals(asset1.penumbraAssetId) ? -1 : 1;

      const r1 = getValue(position.reserves?.r1, direction === 1 ? asset1Exponent : asset2Exponent);
      const r2 = getValue(position.reserves?.r2, direction === 1 ? asset2Exponent : asset1Exponent);
      const p = getValue(
        position.phi?.component?.p,
        direction === 1 ? asset2Exponent : asset1Exponent,
      );
      const q = getValue(
        position.phi?.component?.q,
        direction === 1 ? asset1Exponent : asset2Exponent,
      );
      const price = Number(direction === 1 ? p.div(q) : q.div(p));
      const amount = isBuySide
        ? Number(direction === 1 ? r2 : r1) / price
        : Number(direction === 1 ? r1 : r2);

      const id = computePositionId(position);
      const bech32Id = bech32mPositionId(id);

      return {
        lpId: bech32Id,
        position,
        price,
        amount,
      };
    })
    .filter(displayData => displayData.amount > 0)
    .toSorted((a, b) => b.price - a.price) as Route[];

  return getTotals(routes, isBuySide, limit);
}

const RouteBookLoadingState = () => {
  return (
    <div>
      <div className='text-gray-500'>Loading...</div>
    </div>
  );
};

const RouteBookData = observer(({ bookData: { multiHops } }: { bookData: RouteBookResponse }) => {
  return (
    <div className='h-[512px] text-white'>
      <table className='w-full'>
        <thead>
          <tr>
            <th>Price</th>
            <th className='text-right'>Amount</th>
            <th className='text-right'>Total</th>
            <th className='text-right'>Hops</th>
          </tr>
        </thead>
        <tbody>
          {multiHops.sell.map(trace => (
            <tr key={trace.price + trace.total} style={{ color: 'red' }}>
              <td className='text-left tabular-nums'>{trace.price}</td>
              <td className='text-right tabular-nums'>{trace.amount}</td>
              <td className='text-right tabular-nums'>{trace.total}</td>
              <td className='text-right tabular-nums'>{trace.hops.length}</td>
            </tr>
          ))}
          {multiHops.buy.map(trace => (
            <tr key={trace.price + trace.total} style={{ color: 'green' }}>
              <td className='text-left tabular-nums'>{trace.price}</td>
              <td className='text-right tabular-nums'>{trace.amount}</td>
              <td className='text-right tabular-nums'>{trace.total}</td>
              <td className='text-right tabular-nums'>{trace.hops.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export const RouteBook = observer(() => {
  const { baseAsset, quoteAsset, error: pairError } = usePathToMetadata();
  const {
    data: bookData,
    isLoading: bookIsLoading,
    error: bookErr,
  } = useBook(baseAsset?.symbol, quoteAsset?.symbol);

  if (bookIsLoading || !bookData) {
    return <RouteBookLoadingState />;
  }

  if (bookErr ?? pairError) {
    return <div>Error loading route book: ${String(bookErr ?? pairError)}</div>;
  }

  return <RouteBookData bookData={bookData} />;
});
