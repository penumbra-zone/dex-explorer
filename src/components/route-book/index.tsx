import round from 'lodash/round';
import { useBook } from '@/fetchers/book';
import { fromBaseUnit, splitLoHi } from '@/old/utils/math/hiLo';
import { Metadata } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { Position } from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { Amount } from '@penumbra-zone/protobuf/penumbra/core/num/v1/num_pb';
import { computePositionId } from '@penumbra-zone/wasm/dex';
import { innerToBech32Address } from '@/old/utils/math/bech32';
import { uint8ArrayToBase64 } from '@/old/utils/math/base64';
import { JsonValue } from '@bufbuild/protobuf';

function getDisplayData(data: Position[], symbol1: Metadata, symbol2: Metadata) {
  return data
    .filter(position => position.state?.state === 'POSITION_STATE_ENUM_OPENED')
    .map(position => {
      const direction =
        position.phi?.pair?.asset2?.inner === symbol1.penumbraAssetId?.inner ? -1 : 1;
      const decimals = direction === 1 ? symbol1.decimals : symbol2.decimals;

      const getValue = (property: Amount) =>
        fromBaseUnit(BigInt(property?.lo ?? 0), BigInt(property?.hi ?? 0), decimals);

      const r1 = getValue(position.reserves?.r1?.p);
      const r2 = getValue(position.reserves?.r2?.p);
      const p = getValue(position.phi?.component?.p);
      const q = getValue(position.phi?.component?.q);
      const price = round(direction === 1 ? p.div(q) : q.div(p), 6);
      const amount = round(((direction === 1 ? r2 : r1) / price), 6);
      console.log('TCL: getDisplayData -> price', price);

      const id = computePositionId(Position.fromJson(position as JsonValue));
      const innerStr = uint8ArrayToBase64(id.inner);
      const bech32Id = innerToBech32Address(innerStr, 'plpid');

      return {
        position,
        price,
        amount,
        lpId: bech32Id,
      };
    })
    .filter(displayData => displayData.amount > 0)
    .sort((a, b) => b.price - a.price);
  //       let direction = 1;

  //       if ((position.phi!.pair!.asset2!.inner as unknown as string) === asset1Token.inner) {
  //         direction = -1;
  //       }
  //       console.warn('direciton sell', direction);

  //       const reserves1 = fromBaseUnit(
  //         BigInt(position.reserves!.r1!.lo ?? 0),
  //         BigInt(position.reserves!.r1!.hi ?? 0),
  //         direction === 1 ? asset1Token.decimals : asset2Token.decimals,
  //       );
  //       const reserves2 = fromBaseUnit(
  //         BigInt(position.reserves!.r2!.lo ?? 0),
  //         BigInt(position.reserves!.r2!.hi ?? 0),
  //         direction === 1 ? asset2Token.decimals : asset1Token.decimals,
  //       );

  //       const p: BigNumber = fromBaseUnit(
  //         BigInt(position.phi!.component!.p!.lo || 0),
  //         BigInt(position.phi!.component!.p!.hi || 0),
  //         direction === 1 ? asset2Token.decimals : asset1Token.decimals,
  //       );
  //       const q: BigNumber = fromBaseUnit(
  //         BigInt(position.phi!.component!.q!.lo || 0),
  //         BigInt(position.phi!.component!.q!.hi || 0),
  //         direction === 1 ? asset1Token.decimals : asset2Token.decimals,
  //       );

  //       const price = Number.parseFloat(
  //         direction === 1 ? p.div(q).toFixed(6) : q.div(p).toFixed(6),
  //       );

  //       // Reconstruct a 'real' Position object from the JSON object as it is slightly different
  //       // somewhere up the stack. we need a real Position with toBinary to
  //       // enter wasm. this is sufficient for now.
  //       // console.log("sell position", position);
  //       const protoPosition = Position.fromJson({
  //         phi: {
  //           component: {
  //             p: {
  //               lo: String(position.phi!.component!.p!.lo) || '0',
  //               hi: String(position.phi!.component!.p!.hi) || '0',
  //             },
  //             q: {
  //               lo: String(position.phi!.component!.q!.lo) || '0',
  //               hi: String(position.phi!.component!.q!.hi) || '0',
  //             },
  //             fee: position.phi!.component!.fee as unknown as string,
  //           },
  //           pair: {
  //             asset1: {
  //               inner: position.phi!.pair!.asset1!.inner as unknown as string,
  //             },
  //             asset2: {
  //               inner: position.phi!.pair!.asset2!.inner as unknown as string,
  //             },
  //           },
  //         },
  //         nonce: position.nonce as unknown as string,
  //         state: {
  //           state: position.state?.state.toLocaleString()!,
  //         },
  //         reserves: {
  //           r1: {
  //             lo: String(position.reserves!.r1!.lo) || 0,
  //             hi: String(position.reserves!.r1!.hi) || 0,
  //           },
  //           r2: {
  //             lo: String(position.reserves!.r2!.lo) || 0,
  //             hi: String(position.reserves!.r2!.hi) || 0,
  //           },
  //         },
  //       });
  //       // console.log("sell protoPosition", protoPosition);
  //       const positionId = computePositionId(protoPosition);
  //       // Convert inner byte array to bech32
  //       const innerStr = uint8ArrayToBase64(positionId.inner);
  //       const bech32Id = innerToBech32Address(innerStr, 'plpid');

  //       const willingToSell = Number.parseFloat(
  //         direction === 1 ? reserves1.toFixed(6) : reserves2.toFixed(6),
  //       );

  //       return {
  //         price: price,
  //         reserves1: Number.parseFloat(reserves1.toFixed(6)),
  //         reserves2: Number.parseFloat(reserves2.toFixed(6)),
  //         willingToSell: willingToSell,
  //         lp_id: bech32Id,
  //         position: position,
  //       };
  //     })
  //     // Make sure willingToSell is not 0
  //     .filter(position => {
  //       return position.willingToSell > 0;
  //     })
  //     .sort((a, b) => {
  //       // sort by highest price
  //       return b.price - a.price;
  //     })
  // );
}

const asset1 = {
  display: 'Penumbra',
  symbol: 'um',
  decimals: 5,
  penumbraAssetId: { inner: '' },
};
const asset2 = {
  display: 'GM Wagmi',
  symbol: 'gm',
  decimals: 5,
  penumbraAssetId: { inner: '' },
};

export function RouteBook() {
  const { data } = useBook(asset1.symbol, asset2.symbol, 100);
  const displayData = getDisplayData(data ?? [], asset1, asset2);
  console.log('TCL: RouteBook -> displayData', displayData);

  return <div className='h-[512px]'>holla</div>;
}
