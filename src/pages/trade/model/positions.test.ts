import { beforeAll, describe, expect, it } from 'vitest';
import {
  Position,
  PositionState_PositionStateEnum,
} from '@penumbra-zone/protobuf/penumbra/core/component/dex/v1/dex_pb';
import { ExecutedPosition, positionsStore } from './positions';
import {
  Metadata,
  AssetId,
  DenomUnit,
} from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { compareAssetId } from '@/shared/math/position';

describe('positionsStore', () => {
  const id1 = new Uint8Array(Array(32).fill(0xaa));
  const id2 = new Uint8Array(Array(32).fill(0xbb));

  const createPosition = ({ r1, r2 }: { r1: bigint; r2: bigint }) => {
    return new Position({
      phi: {
        component: {
          fee: 25,
          p: {
            lo: 1n,
            hi: 0n,
          },
          q: {
            lo: 1n,
            hi: 0n,
          },
        },
        pair: {
          asset1: {
            inner: id1,
          },
          asset2: {
            inner: id2,
          },
        },
      },
      nonce: new Uint8Array(Array(32).fill(0xcc)),
      state: {
        state: PositionState_PositionStateEnum.OPENED,
        sequence: 0n,
      },
      reserves: {
        r1: {
          lo: r1,
          hi: 0n,
        },
        r2: {
          lo: r2,
          hi: 0n,
        },
      },
      closeOnFill: false,
    });
  };

  beforeAll(() => {
    const assets: Metadata[] = [
      new Metadata({
        penumbraAssetId: new AssetId({ inner: id1 }),
        display: 'asset1',
        denomUnits: [new DenomUnit({ denom: 'asset1', exponent: 6 })],
      }),
      new Metadata({
        penumbraAssetId: new AssetId({ inner: id2 }),
        display: 'asset2',
        denomUnits: [new DenomUnit({ denom: 'asset2', exponent: 9 })],
      }),
    ];

    positionsStore.setAssets(assets);

    // Assert that id1 and id2 are in canonical order
    expect(
      compareAssetId(new AssetId({ inner: id1 }), new AssetId({ inner: id2 })),
    ).toBeLessThanOrEqual(0);
  });

  describe('getOrdersByBaseQuoteAssets', () => {
    it('should return a buy and sell order when both assets have reserves', () => {
      const position = createPosition({
        r1: 100n,
        r2: 100n,
      });

      const [asset1, asset2] = positionsStore.getCalculatedAssets(position as ExecutedPosition);
      const orders = positionsStore.getOrdersByBaseQuoteAssets(asset1, asset2);
      expect(orders[0]?.direction).toEqual('Buy');
      expect(orders[1]?.direction).toEqual('Sell');
    });

    it('should return a buy order when only the quote asset has reserves', () => {
      const position = createPosition({
        r1: 0n,
        r2: 100n,
      });

      const [asset1, asset2] = positionsStore.getCalculatedAssets(position as ExecutedPosition);
      const orders = positionsStore.getOrdersByBaseQuoteAssets(asset1, asset2);
      expect(orders[0]?.direction).toEqual('Buy');
      expect(orders[1]).toEqual(undefined);
    });

    it('should return a sell order when only the base asset has reserves', () => {
      const position = createPosition({
        r1: 100n,
        r2: 0n,
      });

      const [asset1, asset2] = positionsStore.getCalculatedAssets(position as ExecutedPosition);
      const orders = positionsStore.getOrdersByBaseQuoteAssets(asset1, asset2);
      expect(orders[0]?.direction).toEqual('Sell');
      expect(orders[1]).toEqual(undefined);
    });
  });
});
