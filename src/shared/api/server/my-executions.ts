import { NextRequest, NextResponse } from 'next/server';
import { ChainRegistryClient } from '@penumbra-labs/registry';
import { serialize, Serialized } from '@/shared/utils/serializer';
import { pindexer } from '@/shared/database';
import { RecentExecutionsResponse, transformData } from './recent-executions';
import { AssetId } from '@penumbra-zone/protobuf/penumbra/core/asset/v1/asset_pb';
import { uint8ArrayToHex } from '@penumbra-zone/types/hex';

export interface MyExecutionsRequestBody {
  blockHeight: number;
  start: AssetId;
  end: AssetId;
}

interface ExecutionCollection {
  base: AssetId;
  quote: AssetId;
  heights: number[];
}

const adaptBody = (body: MyExecutionsRequestBody[]): ExecutionCollection[] => {
  const reduced = body.reduce(
    (accum, currentValue) => {
      const hex =
        uint8ArrayToHex(currentValue.start.inner) + uint8ArrayToHex(currentValue.end.inner);
      if (accum[hex]) {
        accum[hex].heights.push(currentValue.blockHeight);
      } else {
        accum[hex] = {
          base: AssetId.fromJson(currentValue.start),
          quote: AssetId.fromJson(currentValue.end),
          heights: [currentValue.blockHeight],
        };
      }
    },
    {} as Record<string, ExecutionCollection>,
  );

  return Object.values(reduced);
};

/**
 * Returns swap traces array for the given asset pair and within the list of block heights. Params:
 * 1. `baseAsset` {string}: base asset symbol
 * 2. `quoteAsset` {string}: quote asset symbol
 * 3. `heights` {number[]}: number of recent executions to return
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<Serialized<RecentExecutionsResponse>>> {
  const chainId = process.env['PENUMBRA_CHAIN_ID'];
  if (!chainId) {
    return NextResponse.json({ error: 'PENUMBRA_CHAIN_ID is not set' }, { status: 500 });
  }

  const registryClient = new ChainRegistryClient();

  const body: MyExecutionsRequestBody[] = await req.json();
  console.log('BODY', body);
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

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
