import { useBook } from '@/fetchers/book';
import { fromBaseUnit } from '@/old/utils/math/hiLo';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { computePositionId } from '@penumbra-zone/wasm/dex';
import { getDisplayDenomExponent } from '@penumbra-zone/getters/metadata';
import { innerToBech32Address } from '@/old/utils/math/bech32';
import { uint8ArrayToBase64 } from '@/old/utils/math/base64';
import { JsonValue } from '@bufbuild/protobuf';
import { useAssets } from '@/shared/state/assets';
import { round } from '@/shared/round';

interface Route {
  lpId: string;
  position: Position;
  price: number;
  displayPrice: number | string;
  amount: number;
  displayAmount: number | string;
  total?: number;
  displayTotal?: number | string;
}

function getTotals(data: Route[], isBuySide: boolean): Route[] {
  const totals = Object.values(
    data.reduce((displayData: Record<string, Route>, route: Route) => {
      const key = route.displayPrice;
      return {
        ...displayData,
        [key]: displayData[key]
          ? {
              ...route,
              total: displayData[key].total ?? 0 + route.amount,
              displayTotal: round(displayData[key].total ?? 0 + route.amount, 6),
              amount: Math.min(displayData[key].amount, route.amount),
            }
          : {
              ...route,
              total: route.amount,
              displayTotal: round(route.amount, 6),
            },
      };
    }, {}),
  );

  return (isBuySide ? totals.slice(0, 8) : totals.slice(-8)) as Route[];
}

function getDisplayData(
  data: Position[],
  asset1: Metadata | undefined,
  asset2: Metadata | undefined,
  isBuySide: boolean,
): Route[] {
  if (!asset1 || !asset2) {
    return [];
  }

  const routes = data
    .filter(position => position.state?.state.toLocaleString() === 'POSITION_STATE_ENUM_OPENED')
    .map(position => {
      const direction =
        asset1.penumbraAssetId?.inner &&
        position.phi?.pair?.asset2?.inner &&
        (position.phi.pair.asset2.inner as unknown as string) ===
          uint8ArrayToBase64(asset1.penumbraAssetId.inner)
          ? -1
          : 1;

      const asset1Exponent = getDisplayDenomExponent(asset1);
      const asset2Exponent = getDisplayDenomExponent(asset2);

      const getValue = (property: Amount | undefined, exponent: number) =>
        fromBaseUnit(BigInt(property?.lo ?? 0), BigInt(property?.hi ?? 0), exponent);

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

      const id = computePositionId(Position.fromJson(position as unknown as JsonValue));
      const innerStr = uint8ArrayToBase64(id.inner);
      const bech32Id = innerToBech32Address(innerStr, 'plpid');

      return {
        lpId: bech32Id,
        position,
        price,
        displayPrice: round(price, asset2Exponent),
        amount,
        displayAmount: round(amount, asset1Exponent),
      };
    })
    .filter(displayData => displayData.amount > 0)
    .sort((a, b) => b.price - a.price) as Route[];

  return getTotals(routes, isBuySide);
}

export function RouteBook() {
  const { data: assets } = useAssets();
  const asset1 = assets?.find(asset => asset.symbol === 'UM');
  const asset2 = assets?.find(asset => asset.symbol === 'GM');

  const { data } = useBook(asset1?.symbol, asset2?.symbol, 100, 50);
  const asks = getDisplayData(data?.asks ?? [], asset1, asset2, false);
  const bids = getDisplayData(data?.bids ?? [], asset1, asset2, true);

  return (
    <div className='h-[512px] text-white'>
      <table className='w-full'>
        <thead>
          <tr>
            <th>Price</th>
            <th className='text-right'>Amount</th>
            <th className='text-right'>Total</th>
          </tr>
        </thead>
        <tbody>
          {asks.map(route => (
            <tr key={route.price} style={{ color: 'red' }}>
              <td className='text-left tabular-nums'>{route.displayPrice}</td>
              <td className='text-right tabular-nums'>{route.displayAmount}</td>
              <td className='text-right tabular-nums'>{route.displayTotal}</td>
            </tr>
          ))}
          {bids.map(route => (
            <tr key={route.price} style={{ color: 'green' }}>
              <td className='text-left tabular-nums'>{route.displayPrice}</td>
              <td className='text-right tabular-nums'>{route.displayAmount}</td>
              <td className='text-right tabular-nums'>{route.displayTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
