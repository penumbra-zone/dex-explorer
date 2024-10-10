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

interface DisplayRoute {
  price: BigInt;
}

function getTotals(data, isBuySide) {
  const totals = Object.values(
    data.reduce((displayData, entry) => {
      console.log('TCL: displayData', displayData);
      console.log('TCL: entry', entry);
      const key = entry.displayPrice;
      return {
        ...displayData,
        [key]: displayData[key]
          ? {
              ...entry,
              total: displayData[key].total + entry.amount,
              displayTotal: round(displayData[key].total + entry.amount, 6),
              amount: Math.min(displayData[key].amount, entry.amount), // Keep the lowest amount
            }
          : {
              ...entry,
              total: entry.amount,
              displayTotal: round(entry.amount, 6),
            },
      };
    }, {}),
  );

  if (isBuySide) {
    return totals.slice(0, 8);
  }
  return totals.slice(-8);
}

function getDisplayData(
  data: Position[],
  asset1: Metadata | undefined,
  asset2: Metadata | undefined,
  isBuySide: boolean,
) {
  if (!asset1 || !asset2) {
    return [];
  }

  const routes = data
    .filter(position => position.state?.state.toLocaleString() === 'POSITION_STATE_ENUM_OPENED')
    .map(position => {
      const direction =
        (position.phi?.pair?.asset2?.inner as unknown as string) ===
        uint8ArrayToBase64(asset1.penumbraAssetId?.inner)
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

      const id = computePositionId(Position.fromJson(position as JsonValue));
      const innerStr = uint8ArrayToBase64(id.inner);
      const bech32Id = innerToBech32Address(innerStr, 'plpid');

      return {
        position,
        price,
        displayPrice: round(price, asset2Exponent),
        amount,
        displayAmount: round(amount, asset1Exponent),
        total: q,
        lpId: bech32Id,
      };
    })
    .filter(displayData => displayData.amount > 0)
    .sort((a, b) => b.price - a.price);

  return getTotals(routes, isBuySide);
}

export function RouteBook() {
  const { data: assets } = useAssets();
  const asset1 = assets?.find(asset => asset.symbol === 'UM');
  const asset2 = assets?.find(asset => asset.symbol === 'GM');

  const { data } = useBook(asset1?.symbol, asset2?.symbol, 100, 50);
  console.log('TCL: RouteBook -> data', data);
  const asks = getDisplayData(data?.asks ?? [], asset1, asset2, false);
  console.log('TCL: RouteBook -> asks', asks);
  const bids = getDisplayData(data?.bids ?? [], asset1, asset2, true);
  console.log('TCL: RouteBook -> bids', bids);

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
              <td>{route.displayPrice}</td>
              <td className='text-right tabular-nums'>{route.displayAmount}</td>
              <td className='text-right tabular-nums'>{route.displayTotal}</td>
            </tr>
          ))}
          {bids.map(route => (
            <tr key={route.price} style={{ color: 'green' }}>
              <td>{route.displayPrice}</td>
              <td className='text-right tabular-nums'>{route.displayAmount}</td>
              <td className='text-right tabular-nums'>{route.displayTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
