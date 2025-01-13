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
import { pnum } from '@penumbra-zone/types/pnum';
import { BigNumber } from 'bignumber.js';

describe('positionsStore', () => {
  const id1 = new Uint8Array(Array(32).fill(0xaa));
  const id2 = new Uint8Array(Array(32).fill(0xbb));
  const p1 = 2;
  const p2 = 1;
  const exponent1 = 6;
  const exponent2 = 9;
  const feeBps = 25;

  const createPosition = ({ r1, r2 }: { r1: bigint; r2: bigint }) => {
    return new Position({
      phi: {
        component: {
          fee: feeBps,
          p: {
            lo: BigInt(p1),
            hi: 0n,
          },
          q: {
            lo: BigInt(p2),
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
        denomUnits: [new DenomUnit({ denom: 'asset1', exponent: exponent1 })],
      }),
      new Metadata({
        penumbraAssetId: new AssetId({ inner: id2 }),
        display: 'asset2',
        denomUnits: [new DenomUnit({ denom: 'asset2', exponent: exponent2 })],
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

  describe('getOrderValueViews', () => {
    it('should return the correct value views for a buy order', () => {
      const position = createPosition({
        r1: 0n,
        r2: pnum(12.123, exponent2).toBigInt(),
      });

      const [asset1, asset2] = positionsStore.getCalculatedAssets(position as ExecutedPosition);
      const orders = positionsStore.getOrdersByBaseQuoteAssets(asset1, asset2);
      const buyOrder = orders[0];

      const valueViews = positionsStore.getOrderValueViews(buyOrder!);

      const basePrice = (p1 / p2) * 10 ** (exponent1 - exponent2);
      const effectivePrice = BigNumber(basePrice)
        .minus(BigNumber(basePrice).times(feeBps).div(10000))
        .toNumber();

      expect(pnum(valueViews.amount).toNumber()).toEqual(
        Number(
          (
            buyOrder!.quoteAsset.amount.toNumber() *
            buyOrder!.quoteAsset.effectivePrice.toNumber() *
            10 ** (exponent2 - exponent1)
          ).toFixed(exponent1),
        ),
      );
      expect(pnum(valueViews.basePrice).toNumber()).toEqual(basePrice);
      expect(pnum(valueViews.effectivePrice).toNumber()).toEqual(effectivePrice);
    });

    it('should return the correct value views for a sell order', () => {
      const position = createPosition({
        r1: pnum(4.567, exponent1).toBigInt(),
        r2: 0n,
      });

      const [asset1, asset2] = positionsStore.getCalculatedAssets(position as ExecutedPosition);
      const orders = positionsStore.getOrdersByBaseQuoteAssets(asset1, asset2);
      const sellOrder = orders[0];

      const valueViews = positionsStore.getOrderValueViews(sellOrder!);
      const basePrice = (p1 / p2) * 10 ** (exponent1 - exponent2);
      const effectivePrice = BigNumber(basePrice)
        .minus(BigNumber(basePrice).times(feeBps).div(10000))
        .toNumber();

      expect(pnum(valueViews.amount).toNumber()).toEqual(4.567);
      expect(pnum(valueViews.basePrice).toNumber()).toEqual(basePrice);
      expect(pnum(valueViews.effectivePrice).toNumber()).toEqual(effectivePrice);
    });
  });
});
