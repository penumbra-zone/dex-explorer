import { NextRequest, NextResponse } from 'next/server';
import { JsonObject } from '@bufbuild/protobuf';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { uint8ArrayToHex } from '@penumbra-zone/types/hex';
import { serialize, Serialized } from '@/shared/utils/serializer';
import { pindexer } from '@/shared/database';
import { RecentExecutionsResponse, transformData } from './recent-executions';

export interface MyExecutionsRequestBody extends JsonObject {
  blockHeight: number;
  base: JsonObject;
  quote: JsonObject;
}

interface ExecutionCollection {
  base: AssetId;
  quote: AssetId;
  heights: number[];
}

/**
 * Combines the list of pair:height combinations into a list of unique pairs with all heights in a merged array.
 * This transformation is needed to reduce the amount of database queries.
 */
const adaptBody = (body: MyExecutionsRequestBody[]): ExecutionCollection[] => {
  const reduced = body.reduce<Record<string, ExecutionCollection>>((accum, currentValue) => {
    const base = AssetId.fromJson(currentValue.base);
    const quote = AssetId.fromJson(currentValue.quote);
    const hex = uint8ArrayToHex(base.inner) + uint8ArrayToHex(quote.inner);

    if (accum[hex]) {
      accum[hex].heights.push(currentValue.blockHeight);
    } else {
      accum[hex] = {
        base,
        quote,
        heights: [currentValue.blockHeight],
      };
    }
    return accum;
  }, {});

  return Object.values(reduced);
};

/**
 * Returns swap traces array for a given list of pair:height combinations.
 * Needed to merge `latestSwap` method from ViewService with `dex_ex_batch_swap_traces` table from
 * Pindexer and get specific swap time, price, hops information, and more.
 *
 * Parameters:
 * 1. `base` {AssetId}: base asset ID
 * 2. `quote` {AssetId}: quote asset ID
 * 3. `blochHeight` {number}: swap block height
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<Serialized<RecentExecutionsResponse>>> {
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!chainId) {
    return NextResponse.json({ error: 'PENUMBRA_CHAIN_ID is not set' }, { status: 500 });
  }

  const registryClient = new ChainRegistryClient();

  const body = (await req.json()) as MyExecutionsRequestBody[];
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // transform data to optimize database queries
  const data = adaptBody(body);

  // We need two queries: * base -> quote (sell)
  //                      * quote -> base (buy)
  const [registry, sellStream, buyStream] = await Promise.all([
    registryClient.remote.get(chainId),
    Promise.all(data.map(data => pindexer.myExecutions(data.base, data.quote, data.heights))),
    Promise.all(data.map(data => pindexer.myExecutions(data.quote, data.base, data.heights))),
  ]);

  const responses = await Promise.all([
    sellStream.flat().map(data => transformData(data, 'sell', registry)),
    buyStream.flat().map(data => transformData(data, 'buy', registry)),
  ]);

  // Weave the two responses together based on timestamps
  const allResponse = responses
    .flat()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json(serialize(allResponse));
}
